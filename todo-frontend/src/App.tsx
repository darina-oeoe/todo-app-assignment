import { useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,   // 👈 import the type
} from "@tanstack/react-query";
import {
  listTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  type Todo,
  type ListResp,
} from "./api/todos";
import "./App.css";

export default function App() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [done, setDone] = useState<"all" | "true" | "false">("all");

  // Infinite query (cursor pagination)
  const query = useInfiniteQuery<
    ListResp<Todo>,                                           // TQueryFnData (what listTodos returns per page)
    Error,                                                    // TError
    InfiniteData<ListResp<Todo>, string | null | undefined>,  // TData (what the hook returns)
    ["todos", string, "all" | "true" | "false"],              // TQueryKey
    string | null | undefined                                 // TPageParam (cursor)
  >({
    queryKey: ["todos", q, done],
    queryFn: ({ pageParam }) =>
      listTodos({
        q: q || undefined,
        done: done === "all" ? undefined : done === "true",
        pageSize: 20,
        cursor: pageParam,
      }),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    initialPageParam: null,
  });

  // Create todo
  const createMut = useMutation({
    mutationFn: createTodo,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["todos"] }),
  });

  return (
    <div
      style={{
        maxWidth: 800,
        margin: "2rem auto",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      }}
    >
      <h1>Todos</h1>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          placeholder="Search..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ flex: 1, padding: 8 }}
        />
        <select
          value={done}
          onChange={(e) => setDone(e.target.value as "all" | "true" | "false")}
          style={{ padding: 8 }}
        >
          <option value="all">All</option>
          <option value="true">Done</option>
          <option value="false">Not done</option>
        </select>
      </div>

      {/* Create form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget as HTMLFormElement);
          const desc = String(fd.get("desc") || "").trim();
          if (desc) createMut.mutate({ description: desc });
          (e.currentTarget as HTMLFormElement).reset();
        }}
        style={{ display: "flex", gap: 8, marginBottom: 12 }}
      >
        <input
          name="desc"
          placeholder="New todo description"
          style={{ flex: 1, padding: 8 }}
        />
        <button type="submit" disabled={createMut.isPending}>
          {createMut.isPending ? "Adding..." : "Add"}
        </button>
      </form>

      {/* List */}
      <div>
        {(query.data?.pages ?? [])
          .flatMap((p: ListResp<Todo>) => p.items)
          .map((t: Todo) => <TodoRow key={t.id} t={t} />)}
      </div>

      {/* Pagination */}
      {query.hasNextPage && (
        <button
          onClick={() => query.fetchNextPage()}
          disabled={query.isFetchingNextPage}
          style={{ marginTop: 12 }}
        >
          {query.isFetchingNextPage ? "Loading..." : "Load more"}
        </button>
      )}
    </div>
  );
}

function TodoRow({ t }: { t: Todo }) {
  const qc = useQueryClient();

  const toggle = useMutation({
    mutationFn: () => updateTodo(t.id, { done: !t.done }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["todos"] }),
  });

  const del = useMutation({
    mutationFn: () => deleteTodo(t.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["todos"] }),
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 0",
        borderBottom: "1px solid #eee",
      }}
    >
      <input
        type="checkbox"
        checked={t.done}
        onChange={() => toggle.mutate()}
      />
      <div style={{ flex: 1 }}>{t.description}</div>
      <button onClick={() => del.mutate()} disabled={del.isPending}>
        {del.isPending ? "Deleting..." : "Delete"}
      </button>
    </div>
  );
}

