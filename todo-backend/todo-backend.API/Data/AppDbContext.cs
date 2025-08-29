using Microsoft.EntityFrameworkCore;
using TodoBackend.API.Models;

namespace TodoBackend.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) {}

    public DbSet<Todo> Todos => Set<Todo>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Todo>(e =>
        {
            e.ToTable("todos");
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Done);
            e.HasIndex(x => x.DueDate);
            e.HasIndex(x => x.ParentId);
            e.HasIndex(x => new { x.CreatedAt, x.Id }); // for keyset sort
            e.Property(x => x.Description).IsRequired();
        });
    }
}
