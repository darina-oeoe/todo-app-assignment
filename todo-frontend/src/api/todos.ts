import { api } from "./client";

export type Todo = {
  id: string;
  parentId: string | null;
  description: string;
  done: boolean;
  dueDate: string | null;      // ISO string (UTC or with offset)
  createdAt: string;           // ISO string
};

export type ListResp<T> = {
  items: T[];
  nextCursor: string | null;
};

export type ListParams = {
  q?: string;                  // text search
  done?: boolean;              // true | false
  dueAfter?: string;           // "YYYY-MM-DD" (interpreted as date)
  dueBefore?: string;          // "YYYY-MM-DD"
  dueOn?: string;              // "YYYY-MM-DD" (optional if API supports)
  parentId?: string | null;
  pageSize?: number;
  cursor?: string | null;
};

export async function listTodos(params: ListParams): Promise<ListResp<Todo>> {
  const { data } = await api.get<ListResp<Todo>>("/todos", { params });
  return data;
}

export type CreateTodoBody = {
  description: string;
  dueDate?: string | null;     // ISO (e.g., new Date(date).toISOString())
  parentId?: string | null;
};

export async function createTodo(body: CreateTodoBody): Promise<Todo> {
  const { data } = await api.post<Todo>("/todos", body);
  return data;
}

export type UpdateTodoBody = Partial<{
  description: string;
  done: boolean;
  dueDate: string | null;
  parentId: string | null;
}>;

export async function updateTodo(id: string, body: UpdateTodoBody): Promise<Todo> {
  // use PUT or PATCH depending on your API; you currently use PUT
  const { data } = await api.put<Todo>(`/todos/${id}`, body);
  return data;
}

export async function deleteTodo(id: string): Promise<void> {
  await api.delete(`/todos/${id}`);
}

