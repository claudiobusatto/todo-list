# Todo List App

A simple todo list with in-memory storage. No database required.

## Setup

1. Install dependencies:

```bash
bun install
```

2. (Optional) Configure env:

```bash
cp .env.example .env
```

## Run

```bash
bun run dev
```

Or without watch:

```bash
bun run start
```

The app listens on **http://localhost:4000** by default (override with `PORT`).

## Usage

- Open **http://localhost:4000** in your browser to use the web UI: add todos, mark them done, and delete them.
- Todos are stored in memory for the lifetime of the process; they are lost when the server restarts.

## API

| Method | Path        | Description                |
|--------|-------------|----------------------------|
| GET    | `/`         | Todo list web UI           |
| GET    | `/health`   | Health check               |
| GET    | `/todos`    | List all todos             |
| POST   | `/todos`    | Create a todo (body: `{ "title": "..." }`) |
| PATCH  | `/todos/:id`| Update todo (body: `{ "title"?: "...", "completed"?: true/false }`) |
| DELETE | `/todos/:id`| Delete a todo              |

Example:

```bash
curl -X POST http://localhost:4000/todos -H "Content-Type: application/json" -d '{"title":"Buy milk"}'
curl http://localhost:4000/todos
```
