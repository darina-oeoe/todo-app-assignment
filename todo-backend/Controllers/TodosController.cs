using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TodoBackend.API.Contracts;
using TodoBackend.API.Data;
using TodoBackend.API.Models;

namespace TodoBackend.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TodosController(AppDbContext db) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<TodoDto>> Create([FromBody] TodoCreateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Description)) return BadRequest("Description required");
        var t = new Todo { Description = dto.Description.Trim(), DueDate = dto.DueDate, ParentId = dto.ParentId };
        db.Todos.Add(t);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = t.Id },
            new TodoDto(t.Id, t.ParentId, t.Description, t.Done, t.DueDate, t.CreatedAt));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TodoDto>> Get(Guid id)
    {
        var t = await db.Todos.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        return t is null ? NotFound() :
            new TodoDto(t.Id, t.ParentId, t.Description, t.Done, t.DueDate, t.CreatedAt);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<TodoDto>> Update(Guid id, [FromBody] TodoUpdateDto dto)
    {
        var t = await db.Todos.FirstOrDefaultAsync(x => x.Id == id);
        if (t is null) return NotFound();

        if (dto.Description is not null) t.Description = dto.Description.Trim();
        if (dto.DueDate is not null) t.DueDate = dto.DueDate;
        if (dto.Done is not null) t.Done = dto.Done.Value;
        if (dto.ParentId is not null)
        {
            if (dto.ParentId == id) return BadRequest("Cannot set parent to self.");
            t.ParentId = dto.ParentId;
        }
        t.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return new TodoDto(t.Id, t.ParentId, t.Description, t.Done, t.DueDate, t.CreatedAt);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var t = await db.Todos.FirstOrDefaultAsync(x => x.Id == id);
        if (t is null) return NotFound();

        bool hasChildren = await db.Todos.AnyAsync(x => x.ParentId == id);
        if (hasChildren) return Conflict("Delete children first.");

        db.Todos.Remove(t);
        await db.SaveChangesAsync();
        return NoContent();
    }

    // List with basic filters + cursor pagination
    [HttpGet]
    public async Task<ActionResult<ListResponse<TodoDto>>> List([FromQuery] string? q, [FromQuery] bool? done,
        [FromQuery] DateTime? dueBefore, [FromQuery] DateTime? dueAfter, [FromQuery] DateTime? dueOn,
        [FromQuery] Guid? parentId, [FromQuery] int pageSize = 20, [FromQuery] string? cursor = null)
    {
        var query = db.Todos.AsNoTracking();

        if (done is not null) query = query.Where(t => t.Done == done);
        if (dueBefore is not null) query = query.Where(t => t.DueDate != null && t.DueDate <= dueBefore);
        if (dueAfter  is not null) query = query.Where(t => t.DueDate != null && t.DueDate >= dueAfter);
        if (dueOn    is not null)  query = query.Where(t => t.DueDate != null && t.DueDate!.Value.Date == dueOn.Value.Date);
        if (parentId is not null)  query = query.Where(t => t.ParentId == parentId);
        if (!string.IsNullOrWhiteSpace(q))
            query = query.Where(t => EF.Functions.ILike(t.Description, $"%{q}%"));

        query = query.OrderByDescending(t => t.CreatedAt).ThenByDescending(t => t.Id);

        if (!string.IsNullOrWhiteSpace(cursor))
        {
            var parts = System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(cursor)).Split('|');
            var created = DateTime.Parse(parts[0]);
            var id = Guid.Parse(parts[1]);
            query = query.Where(t => t.CreatedAt < created || (t.CreatedAt == created && t.Id.CompareTo(id) < 0));
        }

        int take = Math.Clamp(pageSize, 1, 100);
        var items = await query.Take(take + 1).ToListAsync();

        string? next = null;
        if (items.Count > take)
        {
            var last = items[take - 1];
            next = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes($"{last.CreatedAt:o}|{last.Id}"));
            items = items.Take(take).ToList();
        }

        var res = items.Select(t => new TodoDto(t.Id, t.ParentId, t.Description, t.Done, t.DueDate, t.CreatedAt)).ToList();
        return new ListResponse<TodoDto>(res, next);
    }
}

