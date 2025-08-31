import { useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import {
  listTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  type Todo,
  type ListResp,
} from "./api/todos";
import { format } from "date-fns";
import "./App.css";

/** Root page */
export default function App() {
  const qc = useQueryClient();

  // Search / filter state
  const [q, setQ] = useState("");
  const [done, setDone] = useState<"all" | "true" | "false">("all");
  const [dueAfter, setDueAfter] = useState<string | undefined>(undefined);
  const [dueBefore, setDueBefore] = useState<string | undefined>(undefined);

  // Infinite query for top-level todos (parentId = null)
  const query = useInfiniteQuery<
    ListResp<Todo>,
    Error,
    InfiniteData<ListResp<Todo>, string | null | undefined>,
    ["todos", string, "all" | "true" | "false", string | undefined, string | undefined],
    string | null | undefined
  >({
    queryKey: ["todos", q, done, dueAfter, dueBefore],
    queryFn: ({ pageParam }) =>
      listTodos({
        q: q || undefined,
        done: done === "all" ? undefined : done === "true",
        dueAfter,
        dueBefore,
        pageSize: 20,
        cursor: pageParam,
        parentId: null, // root level
      }),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    initialPageParam: null,
  });

  // Create new root-level todo
  const createMut = useMutation({
    mutationFn: createTodo,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["todos"] }),
  });

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "2rem auto",
        fontFamily: 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif',
      }}
    >
      <h1>Todos</h1>

      {/* ===== Search & Filters ===== */}
      <section
        style={{
          padding: 12,
          border: "1px solid #eee",
          borderRadius: 8,
          marginBottom: 16,
        }}
      >
        <h2 style={{ fontSize: 16, margin: "0 0 8px" }}>Search & filters</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 140px",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <input
            placeholder="Search…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ padding: 8 }}
          />
          <select
            value={done}
            onChange={(e) => setDone(e.target.value as any)}
            style={{ padding: 8 }}
          >
            <option value="all">All</option>
            <option value="true">Done</option>
            <option value="false">Not done</option>
          </select>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
          }}
        >
          <label style={{ display: "grid", gap: 4 }}>
            <span style={{ fontSize: 12, color: "#666" }}>Due after</span>
            <input
              type="date"
              value={dueAfter || ""}
              onChange={(e) => setDueAfter(e.target.value || undefined)}
              style={{ padding: 8 }}
            />
          </label>
          <label style={{ display: "grid", gap: 4 }}>
            <span style={{ fontSize: 12, color: "#666" }}>Due before</span>
            <input
              type="date"
              value={dueBefore || ""}
              onChange={(e) => setDueBefore(e.target.value || undefined)}
              style={{ padding: 8 }}
            />
          </label>
        </div>
      </section>

      {/* Divider */}
      <hr style={{ border: 0, borderTop: "1px solid #eee", margin: "16px 0" }} />

      {/* ===== Add new todo ===== */}
      <section
        style={{
          padding: 12,
          border: "1px solid #eee",
          borderRadius: 8,
          marginBottom: 16,
        }}
      >
        <h2 style={{ fontSize: 16, margin: "0 0 8px" }}>Add new todo</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget as HTMLFormElement);
            const desc = String(fd.get("desc") || "").trim();
            const dueRaw = String(fd.get("due") || "");
            const dueDate = dueRaw ? new Date(dueRaw).toISOString() : undefined;
            if (desc) createMut.mutate({ description: desc, dueDate, parentId: null });
            (e.currentTarget as HTMLFormElement).reset();
          }}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 160px 92px",
            gap: 8,
          }}
        >
          <input name="desc" placeholder="New todo description" style={{ padding: 8 }} />
          <input name="due" type="date" style={{ padding: 8 }} />
          <button type="submit" disabled={createMut.isPending}>
            {createMut.isPending ? "Adding…" : "Add"}
          </button>
        </form>
      </section>

      {/* ===== List (root) ===== */}
      <div>
        {(query.data?.pages ?? [])
          .flatMap((p: ListResp<Todo>) => p.items)
          .map((t) => (
            <TodoRow key={t.id} t={t} depth={0} />
          ))}
      </div>

      {query.hasNextPage && (
        <button
          onClick={() => query.fetchNextPage()}
          disabled={query.isFetchingNextPage}
          style={{ marginTop: 12 }}
        >
          {query.isFetchingNextPage ? "Loading…" : "Load more"}
        </button>
      )}
    </div>
  );
}

/** A single todo row with: toggle, due date, delete, expand children, add subtask */
function TodoRow({ t, depth }: { t: Todo; depth: number }) {
  const qc = useQueryClient();

  const toggle = useMutation({
    mutationFn: () => updateTodo(t.id, { done: !t.done }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["todos"] }),
  });

  const del = useMutation({
    mutationFn: () => deleteTodo(t.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["todos"] }),
  });

  // For children list (subtasks)
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ paddingLeft: depth * 16 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "24px 1fr auto auto",
          alignItems: "center",
          gap: 8,
          padding: "8px 0",
          borderBottom: "1px solid #eee",
        }}
      >
        <input type="checkbox" checked={t.done} onChange={() => toggle.mutate()} />

        <div>
          <div style={{ textDecoration: t.done ? "line-through" : "none" }}>
            {t.description}
          </div>
          <div style={{ fontSize: 12, color: "#666" }}>
            {t.dueDate
              ? `Due: ${format(new Date(t.dueDate), "yyyy-MM-dd")}`
              : "No due date"}
          </div>
        </div>

        {/* Expand / collapse */}
        <button onClick={() => setExpanded((e) => !e)} style={{ marginLeft: 8 }}>
          {expanded ? "Hide subtasks" : "Show subtasks"}
        </button>

        {/* Delete */}
        <button onClick={() => del.mutate()} disabled={del.isPending}>
          {del.isPending ? "Deleting…" : "Delete"}
        </button>
      </div>

      {/* Children section */}
      {expanded && <Subtasks parentId={t.id} depth={depth + 1} />}
    </div>
  );
}

/** Recursive subtasks list with its own infinite query + create subtask form */
function Subtasks({ parentId, depth }: { parentId: string; depth: number }) {
  const qc = useQueryClient();

  const children = useInfiniteQuery<
    ListResp<Todo>,
    Error,
    InfiniteData<ListResp<Todo>, string | null | undefined>,
    ["todos", "children", string],
    string | null | undefined
  >({
    queryKey: ["todos", "children", parentId],
    queryFn: ({ pageParam }) =>
      listTodos({
        parentId,
        pageSize: 10,
        cursor: pageParam,
      }),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    initialPageParam: null,
  });

  const addChild = useMutation({
    mutationFn: createTodo,
    onSuccess: () => {
      // refresh this branch and the root caches
      qc.invalidateQueries({ queryKey: ["todos", "children", parentId] });
      qc.invalidateQueries({ queryKey: ["todos"] });
    },
  });

  return (
    <div style={{ paddingLeft: 16 }}>
      {/* Add subtask form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget as HTMLFormElement);
          const desc = String(fd.get("desc") || "").trim();
          const dueRaw = String(fd.get("due") || "");
          const dueDate = dueRaw ? new Date(dueRaw).toISOString() : undefined;
          if (desc) addChild.mutate({ description: desc, dueDate, parentId });
          (e.currentTarget as HTMLFormElement).reset();
        }}
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 140px 110px",
          gap: 8,
          margin: "8px 0 4px",
        }}
      >
        <input name="desc" placeholder="Add subtask…" style={{ padding: 8 }} />
        <input name="due" type="date" style={{ padding: 8 }} />
        <button type="submit" disabled={addChild.isPending}>
          {addChild.isPending ? "Adding…" : "Add subtask"}
        </button>
      </form>

      {/* Children list */}
      <div>
        {(children.data?.pages ?? [])
          .flatMap((p: ListResp<Todo>) => p.items)
          .map((child) => (
            <TodoRow key={child.id} t={child} depth={depth} />
          ))}
      </div>

      {children.hasNextPage && (
        <button
          onClick={() => children.fetchNextPage()}
          disabled={children.isFetchingNextPage}
          style={{ marginTop: 8 }}
        >
          {children.isFetchingNextPage ? "Loading…" : "Load more subtasks"}
        </button>
      )}
    </div>
  );
}

