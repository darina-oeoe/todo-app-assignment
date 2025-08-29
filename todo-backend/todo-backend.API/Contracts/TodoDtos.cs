namespace TodoBackend.API.Contracts;

public record TodoCreateDto(string Description, DateTime? DueDate, Guid? ParentId);
public record TodoUpdateDto(string? Description, DateTime? DueDate, bool? Done, Guid? ParentId);
public record TodoDto(Guid Id, Guid? ParentId, string Description, bool Done, DateTime? DueDate, DateTime CreatedAt);
public record ListResponse<T>(IReadOnlyList<T> Items, string? NextCursor);

