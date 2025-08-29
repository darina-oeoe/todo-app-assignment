import { api } from "./client";

export type Todo = {
  id: string;
  parentId?: string | null;
  description: string;
  done: boolean;
  dueDate?: string | null;
  createdAt: string;
};
export type ListResp<T> = { items: T[]; nextCursor?: string | null };

export async function listTodos(params: any): Promise<ListResp<Todo>> {
  const { data } = await api.get("/todos", { params });
  return data;
}
export async function createTodo(body: { description: string; dueDate?: string | null; parentId?: string | null }) {
  const { data } = await api.post("/todos", body);
  return data as Todo;
}
export async function updateTodo(id: string, body: any) {
  const { data } = await api.put(`/todos/${id}`, body);
  return data as Todo;
}
export async function deleteTodo(id: string) {
  await api.delete(`/todos/${id}`);
}

