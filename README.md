# Test Assignment – Todo App (React + ASP.NET Core + PostgreSQL)

## Thought process and reasoning

**Why these technologies**  
- **ASP.NET Core + EF Core**: strongly typed backend, fast dev loop, first-class PostgreSQL provider, migrations for schema evolution.
- **PostgreSQL**: reliable, rich indexing & extensions; we use **pg_trgm** for fast substring search.
- **React + TypeScript**: type safety and modular UI.
- **React Query**: caching, pagination, mutations with minimal boilerplate.
- **Docker Compose**: one-command reproducible setup for FE + API + DB.

**Structure & decisions**  
- **Keyset (cursor) pagination** on `(CreatedAt, Id)` to avoid OFFSET scans at scale and keep stable ordering.
- **Indexes**: on `Done`, `DueDate`, `ParentId`, and composite `(CreatedAt, Id)`; optional trigram GIN index on `Description`.
- **Auto-migrations**: API applies EF migrations on startup → no manual DB step.
- **CORS** enabled for `http://localhost:3000` and `http://localhost:8181` for FE calls.
- **HTTPS redirect disabled** inside containers to simplify local dev (plain HTTP).

**Repo layout**
```
docker-compose.yml
todo-backend/
  todo-backend.API/   # ASP.NET Core API (net9.0)
todo-frontend/        # React + TS app
```

---

## Step-by-step guide to run

### Prereqs
- Docker Desktop (or Docker Engine) with Compose

### Run
```bash
# from repo root
docker compose up --build -d
```
Services:
- **Frontend** → http://localhost:8181  
- **Backend API** → http://localhost:8182/swagger  (and `/api/todos`)  
- **Database** → localhost:5442  (user: `postgres`, pass: `postgres`, db: `db`)

### Stop / reset
```bash
docker compose down          # stop
docker compose down -v       # stop + remove volumes (fresh DB)
```

---

## API

**Base URL:** `http://localhost:8182/api`

### Endpoints
- `GET /todos?pageSize=20&cursor=<token>&q=<text>&done=true|false&dueBefore=&dueAfter=&dueOn=&parentId=`  
  Returns `{ "items": [ ... ], "nextCursor": "..." }`
- `POST /todos`
  ```json
  { "description": "first task", "dueDate": null, "parentId": null }
  ```
- `PUT /todos/{id}` (partial update)
  ```json
  { "description": "new text", "done": true, "dueDate": "2025-09-01T00:00:00Z", "parentId": null }
  ```
- `DELETE /todos/{id}` (conflict if children exist)

### Curl quickstart
```bash
curl -s http://localhost:8182/api/todos

curl -s -X POST http://localhost:8182/api/todos   -H "Content-Type: application/json"   -d '{"description":"wash dishes"}'

ID=<paste-id>
curl -s -X PUT http://localhost:8182/api/todos/$ID   -H "Content-Type: application/json"   -d '{"done": true}'
```

---

## Frontend

- React + TypeScript app powered by React Query.
- API client (`src/api/`) uses `REACT_APP_API_BASE` or defaults to `http://localhost:8182/api`.

**Dev (outside Docker):**
```bash
cd todo-frontend
npm install
npm start     # http://localhost:3000
```
Ensure API is running (Docker) and CORS allows `http://localhost:3000`.

**Dockerized FE:** served via Nginx at `http://localhost:8181` (configured in `docker-compose.yml`).

---

## Database & performance

- EF Core model mapped to table `todos` with PascalCase columns (e.g., `"Description"`).
- **Indexes**: `Done`, `DueDate`, `ParentId`, `(CreatedAt, Id)`.
- **Trigram search** (optional migration): creates pg_trgm extension and a GIN index on `"Description"` for fast `ILIKE '%text%'`.

**Seed sample data (optional):**
```bash
docker exec -it todo-db psql -U postgres -d db -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"
docker exec -it todo-db psql -U postgres -d db -c "
INSERT INTO todos (id, parent_id, description, done, due_date, created_at, updated_at)
SELECT gen_random_uuid(), NULL, 'Task #' || gs, (random()<0.5),
       CURRENT_DATE + ((random()*90 - 45))::int,
       NOW() - (random()*'30 days'::interval), NOW()
FROM generate_series(1, 5000) gs;"
```

---

## Troubleshooting

- **API not responding / curl reset**: check `docker logs todo-api`. Often a migration SQL typo (quoted identifiers).
- **DB keeps restarting**: run `docker compose down -v` to clear old Postgres volumes before changing major versions.
- **CORS errors**: backend CORS must include the FE origin(s). In `Program.cs` ensure:
  ```csharp
  builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
      p.WithOrigins("http://localhost:3000", "http://localhost:8181")
       .AllowAnyHeader().AllowAnyMethod()));
  app.UseCors();
  ```
- **Swagger missing**: enable unconditionally in `Program.cs`:
  ```csharp
  app.UseSwagger();
  app.UseSwaggerUI();
  ```

