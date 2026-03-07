const port = Number(process.env.PORT ?? 4000);

type Todo = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
};

const todos: Todo[] = [];
let nextId = 1;

function generateId(): string {
  return String(nextId++);
}

function getTodoIndex(id: string): number {
  return todos.findIndex((t) => t.id === id);
}

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Todo List</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 28rem;
      margin: 2rem auto;
      padding: 0 1rem;
      background: #0f0f12;
      color: #e4e4e7;
      min-height: 100vh;
    }
    h1 {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
      color: #fafafa;
    }
    form {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
    }
    input[type="text"] {
      flex: 1;
      padding: 0.6rem 0.75rem;
      border: 1px solid #3f3f46;
      border-radius: 0.375rem;
      background: #18181b;
      color: #e4e4e7;
      font-size: 1rem;
    }
    input[type="text"]::placeholder { color: #71717a; }
    input[type="text"]:focus {
      outline: none;
      border-color: #6366f1;
    }
    button {
      padding: 0.6rem 1rem;
      border: none;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
    }
    button.primary {
      background: #6366f1;
      color: white;
    }
    button.primary:hover { background: #4f46e5; }
    button.danger {
      background: transparent;
      color: #a1a1aa;
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
    }
    button.danger:hover { color: #ef4444; }
    ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    li {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      border-radius: 0.375rem;
      background: #18181b;
      border: 1px solid #27272a;
      margin-bottom: 0.5rem;
    }
    li.done { opacity: 0.7; }
    li.done .title { text-decoration: line-through; color: #71717a; }
    input[type="checkbox"] {
      width: 1.125rem;
      height: 1.125rem;
      accent-color: #6366f1;
      cursor: pointer;
    }
    .title { flex: 1; word-break: break-word; }
    .error { color: #f87171; font-size: 0.875rem; margin-top: 0.5rem; }
  </style>
</head>
<body>
  <h1>Todo List</h1>
  <form id="form">
    <input type="text" id="input" placeholder="What needs to be done?" autocomplete="off" />
    <button type="submit" class="primary">Add</button>
  </form>
  <p id="error" class="error" hidden></p>
  <ul id="list"></ul>
  <script>
    const form = document.getElementById('form');
    const input = document.getElementById('input');
    const list = document.getElementById('list');
    const errEl = document.getElementById('error');

    function showError(msg) {
      errEl.textContent = msg;
      errEl.hidden = false;
    }
    function clearError() {
      errEl.textContent = '';
      errEl.hidden = true;
    }

    async function load() {
      const res = await fetch('/todos');
      if (!res.ok) return showError('Failed to load todos');
      clearError();
      const data = await res.json();
      list.innerHTML = data.todos.map(t => 
        '<li data-id="' + t.id + '" class="' + (t.completed ? 'done' : '') + '">' +
        '<input type="checkbox" ' + (t.completed ? 'checked' : '') + ' />' +
        '<span class="title">' + escapeHtml(t.title) + '</span>' +
        '<button type="button" class="danger">Delete</button></li>'
      ).join('');
      list.querySelectorAll('input[type="checkbox"]').forEach((cb, i) => {
        cb.addEventListener('change', () => toggle(data.todos[i].id));
      });
      list.querySelectorAll('button.danger').forEach((btn, i) => {
        btn.addEventListener('click', () => remove(data.todos[i].id));
      });
    }

    function escapeHtml(s) {
      const div = document.createElement('div');
      div.textContent = s;
      return div.innerHTML;
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = input.value.trim();
      if (!title) return;
      const res = await fetch('/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) return showError('Failed to add todo');
      clearError();
      input.value = '';
      load();
    });

    async function toggle(id) {
      const li = list.querySelector('[data-id="' + id + '"]');
      const completed = li.querySelector('input[type="checkbox"]').checked;
      const res = await fetch('/todos/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      });
      if (!res.ok) return showError('Failed to update');
      li.classList.toggle('done', completed);
    }

    async function remove(id) {
      const res = await fetch('/todos/' + id, { method: 'DELETE' });
      if (!res.ok) return showError('Failed to delete');
      load();
    }

    load();
  </script>
</body>
</html>`;

const server = Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);
    const method = req.method.toUpperCase();
    const path = url.pathname;

    if (method === "GET" && path === "/") {
      return new Response(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (method === "GET" && path === "/health") {
      return Response.json({ status: "ok", service: "todo-list" });
    }

    if (method === "GET" && path === "/todos") {
      return Response.json({ todos });
    }

    if (method === "POST" && path === "/todos") {
      let body: { title?: string };
      try {
        body = await req.json();
      } catch {
        return Response.json({ error: "Invalid JSON" }, { status: 400 });
      }
      const title = typeof body?.title === "string" ? body.title.trim() : "";
      if (!title) {
        return Response.json({ error: "title is required" }, { status: 400 });
      }
      const todo: Todo = {
        id: generateId(),
        title,
        completed: false,
        createdAt: new Date().toISOString(),
      };
      todos.push(todo);
      return Response.json(todo, { status: 201 });
    }

    const patchMatch = path.match(/^\/todos\/(.+)$/);
    if (method === "PATCH" && patchMatch) {
      const id = patchMatch[1];
      const idx = getTodoIndex(id);
      if (idx === -1) {
        return Response.json({ error: "Todo not found" }, { status: 404 });
      }
      let body: { title?: string; completed?: boolean };
      try {
        body = await req.json();
      } catch {
        return Response.json({ error: "Invalid JSON" }, { status: 400 });
      }
      if (typeof body?.title === "string") todos[idx].title = body.title.trim();
      if (typeof body?.completed === "boolean") todos[idx].completed = body.completed;
      return Response.json(todos[idx]);
    }

    const deleteMatch = path.match(/^\/todos\/(.+)$/);
    if (method === "DELETE" && deleteMatch) {
      const id = deleteMatch[1];
      const idx = getTodoIndex(id);
      if (idx === -1) {
        return Response.json({ error: "Todo not found" }, { status: 404 });
      }
      todos.splice(idx, 1);
      return new Response(null, { status: 204 });
    }

    return Response.json({ error: "Not Found" }, { status: 404 });
  },
});

console.log(`Todo list app listening on ${server.url}`);
