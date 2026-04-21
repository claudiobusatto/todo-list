import { config } from "./config";
import { coolKeeper } from "./coolkeeper";

const port = Number(config.PORT);

type User = {
  id: string;
  name: string;
};

type Todo = {
  id: string;
  title: string;
  category: string;
  completed: boolean;
  createdAt: string;
  assignedToUserId: string | null;
};

const users: User[] = [];
const todos: Todo[] = [];
let nextUserId = 1;
let nextTodoId = 1;

function generateUserId(): string {
  return String(nextUserId++);
}

function generateTodoId(): string {
  return String(nextTodoId++);
}

function findUserById(id: string): User | undefined {
  return users.find((u) => u.id === id);
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

    :root {
      color-scheme: dark;
      --bg-0: #080c17;
      --bg-1: #10192e;
      --panel: rgba(16, 24, 44, 0.78);
      --panel-soft: rgba(34, 44, 69, 0.35);
      --line: rgba(148, 163, 184, 0.24);
      --text-main: #ecf2ff;
      --text-muted: #a2afc6;
      --primary: #7c8cff;
      --primary-strong: #5f71ff;
      --danger: #ff5f7d;
      --radius-lg: 16px;
      --radius-md: 12px;
      --shadow: 0 18px 55px rgba(7, 12, 24, 0.45);
    }

    body {
      font-family: Inter, "Segoe UI", Roboto, system-ui, -apple-system, sans-serif;
      margin: 0;
      padding: 2.5rem 1rem;
      background:
        radial-gradient(1200px 600px at 10% -20%, rgba(127, 150, 255, 0.16), transparent 55%),
        radial-gradient(900px 560px at 100% 0%, rgba(56, 189, 248, 0.14), transparent 45%),
        linear-gradient(165deg, var(--bg-0) 0%, var(--bg-1) 100%);
      color: var(--text-main);
      min-height: 100vh;
    }

    .app {
      max-width: 860px;
      margin: 0 auto;
      padding: 1.25rem;
      border: 1px solid var(--line);
      border-radius: calc(var(--radius-lg) + 8px);
      background: linear-gradient(165deg, rgba(18, 27, 47, 0.84), rgba(10, 16, 30, 0.9));
      backdrop-filter: blur(8px);
      box-shadow: var(--shadow);
    }

    .header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
    }

    h1 {
      margin: 0;
      font-size: clamp(1.4rem, 2.2vw, 2rem);
      letter-spacing: 0.2px;
    }

    .subtitle {
      margin-top: 0.4rem;
      color: var(--text-muted);
      font-size: 0.93rem;
    }

    .layout {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .section {
      margin: 0;
      padding: 1rem;
      border: 1px solid var(--line);
      border-radius: var(--radius-lg);
      background: var(--panel);
    }

    .section h2 {
      margin: 0 0 0.85rem;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
    }

    form {
      display: flex;
      flex-wrap: wrap;
      gap: 0.65rem;
      margin: 0;
    }

    input[type="text"],
    select {
      min-height: 42px;
      padding: 0.6rem 0.75rem;
      border: 1px solid var(--line);
      border-radius: var(--radius-md);
      background: rgba(14, 20, 35, 0.78);
      color: var(--text-main);
      font-size: 0.95rem;
      transition: border-color 120ms ease, box-shadow 120ms ease, transform 120ms ease;
    }

    input[type="text"] {
      flex: 1;
      min-width: 170px;
    }

    #category,
    #assignee {
      min-width: 130px;
    }

    input[type="text"]::placeholder { color: #7f8aa4; }
    input[type="text"]:focus,
    select:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 4px rgba(124, 140, 255, 0.2);
      transform: translateY(-1px);
    }

    button {
      min-height: 42px;
      padding: 0.58rem 0.95rem;
      border: 1px solid transparent;
      border-radius: var(--radius-md);
      font-size: 0.86rem;
      font-weight: 600;
      letter-spacing: 0.01em;
      cursor: pointer;
      transition: transform 120ms ease, filter 120ms ease, border-color 120ms ease;
    }

    button:hover {
      transform: translateY(-1px);
      filter: brightness(1.03);
    }

    button.primary {
      background: linear-gradient(160deg, var(--primary), var(--primary-strong));
      color: white;
    }

    button.danger {
      min-height: 32px;
      padding: 0.35rem 0.65rem;
      border: 1px solid rgba(255, 95, 125, 0.4);
      background: rgba(255, 95, 125, 0.1);
      color: #ffd3dc;
      font-size: 0.75rem;
      margin-left: auto;
    }

    button.danger:hover {
      border-color: rgba(255, 95, 125, 0.75);
      background: rgba(255, 95, 125, 0.2);
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    #userList {
      display: flex;
      flex-wrap: wrap;
      gap: 0.55rem;
    }

    #userList li {
      margin: 0;
      padding: 0.38rem 0.7rem;
      border-radius: 999px;
      border: 1px solid var(--line);
      background: var(--panel-soft);
      color: #dbe7ff;
      font-size: 0.8rem;
      display: inline-flex;
      align-items: center;
    }

    li {
      display: flex;
      align-items: center;
      gap: 0.68rem;
      padding: 0.75rem 0.85rem;
      border-radius: var(--radius-md);
      background: rgba(14, 20, 36, 0.85);
      border: 1px solid var(--line);
      margin-bottom: 0.65rem;
    }

    li.done {
      opacity: 0.72;
      background: rgba(14, 20, 36, 0.58);
    }

    li.done .title {
      text-decoration: line-through;
      color: #8a95b0;
    }

    input[type="checkbox"] {
      width: 1.125rem;
      height: 1.125rem;
      accent-color: var(--primary-strong);
      cursor: pointer;
    }

    .title {
      flex: 1;
      word-break: break-word;
    }

    .category {
      font-size: 0.72rem;
      padding: 0.24rem 0.6rem;
      border-radius: 9999px;
      background: rgba(76, 94, 140, 0.3);
      color: #ccd7f8;
      border: 1px solid rgba(147, 164, 221, 0.25);
    }

    .assignee {
      font-size: 0.75rem;
      color: var(--text-muted);
      min-width: 100px;
      text-align: right;
    }

    .error {
      color: #ffc2cf;
      font-size: 0.875rem;
      margin-top: 0.85rem;
      padding: 0.6rem 0.72rem;
      border-radius: var(--radius-md);
      border: 1px solid rgba(255, 95, 125, 0.45);
      background: rgba(255, 95, 125, 0.12);
    }

    #list {
      margin-top: 1rem;
    }

    @media (max-width: 680px) {
      body { padding-top: 1rem; }
      .app { padding: 0.85rem; }
      .header {
        flex-direction: column;
        align-items: flex-start;
      }
      .assignee {
        text-align: left;
        min-width: auto;
      }
      li {
        flex-wrap: wrap;
      }
      button.danger {
        margin-left: 0;
      }
    }
  </style>
</head>
<body>
  <main class="app">
    <header class="header">
      <div>
        <h1>Todo List</h1>
        <p class="subtitle">Organize tasks with categories and assignees</p>
      </div>
    </header>
    <div class="layout">
      <section class="section">
        <h2>Users</h2>
        <form id="userForm">
          <input type="text" id="userName" placeholder="User name" autocomplete="off" />
          <button type="submit" class="primary">Add user</button>
        </form>
        <ul id="userList"></ul>
      </section>
      <section class="section">
        <h2>New todo</h2>
        <form id="form">
          <input type="text" id="input" placeholder="What needs to be done?" autocomplete="off" />
          <select id="category">
            <option value="Work">Work</option>
            <option value="Personal">Personal</option>
            <option value="Shopping">Shopping</option>
            <option value="Other">Other</option>
          </select>
          <select id="assignee">
            <option value="">Unassigned</option>
          </select>
          <button type="submit" class="primary">Add</button>
        </form>
      </section>
    </div>
    <p id="error" class="error" hidden></p>
    <ul id="list"></ul>
  </main>
  <script>
    const form = document.getElementById('form');
    const input = document.getElementById('input');
    const categorySelect = document.getElementById('category');
    const assigneeSelect = document.getElementById('assignee');
    const list = document.getElementById('list');
    const errEl = document.getElementById('error');
    const userForm = document.getElementById('userForm');
    const userNameInput = document.getElementById('userName');
    const userList = document.getElementById('userList');

    function showError(msg) {
      errEl.textContent = msg;
      errEl.hidden = false;
    }
    function clearError() {
      errEl.textContent = '';
      errEl.hidden = true;
    }

    async function loadUsers() {
      const res = await fetch('/users');
      if (!res.ok) return;
      const data = await res.json();
      assigneeSelect.innerHTML = '<option value="">Unassigned</option>' +
        data.users.map(u => '<option value="' + u.id + '">' + escapeHtml(u.name) + '</option>').join('');
      userList.innerHTML = data.users.map(u => '<li>' + escapeHtml(u.name) + '</li>').join('');
    }

    async function load() {
      const res = await fetch('/todos');
      if (!res.ok) return showError('Failed to load todos');
      clearError();
      const data = await res.json();
      list.innerHTML = data.todos.map(t => {
        const assignee = t.assignedUser ? escapeHtml(t.assignedUser.name) : '—';
        return '<li data-id="' + t.id + '" class="' + (t.completed ? 'done' : '') + '">' +
          '<input type="checkbox" ' + (t.completed ? 'checked' : '') + ' />' +
          '<span class="title">' + escapeHtml(t.title) + '</span>' +
          '<span class="category">' + escapeHtml(t.category || 'General') + '</span>' +
          '<span class="assignee">' + assignee + '</span>' +
          '<button type="button" class="danger">Delete</button></li>';
      }).join('');
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

    userForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = (userNameInput && userNameInput.value) ? userNameInput.value.trim() : '';
      if (!name) return;
      const res = await fetch('/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) return showError('Failed to add user');
      clearError();
      userNameInput.value = '';
      loadUsers();
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = input.value.trim();
      if (!title) return;
      const category = (categorySelect && categorySelect.value) ? categorySelect.value : 'General';
      const assignedToUserId = (assigneeSelect && assigneeSelect.value) ? assigneeSelect.value : null;
      const res = await fetch('/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category, assignedToUserId }),
      });
      if (!res.ok) return showError('Failed to add todo');
      clearError();
      input.value = '';
      load();
    });

    async function toggle(id) {
      const li = list.querySelector('[data-id="' + id + '"]');
      const cb = li.querySelector('input[type="checkbox"]');
      const completed = cb.checked;
      const res = await fetch('/todos/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      });
      if (!res.ok) {
        cb.checked = !completed;
        li.classList.toggle('done', !completed);
        return showError('Failed to update');
      }
      li.classList.toggle('done', completed);
    }

    async function remove(id) {
      const res = await fetch('/todos/' + id, { method: 'DELETE' });
      if (!res.ok) return showError('Failed to delete');
      load();
    }

    loadUsers();
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

    try {
      if (method === "GET" && path === "/") {
        return new Response(html, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }

      if (method === "GET" && path === "/health") {
        return Response.json({ status: "ok", service: "todo-list" });
      }

      if (method === "GET" && path === "/users") {
        return Response.json({ users });
      }

      if (method === "POST" && path === "/users") {
        let body: { name?: string };
        try {
          body = await req.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }
        const name = typeof body?.name === "string" ? body.name.trim() : "";
        if (!name) {
          return Response.json({ error: "name is required" }, { status: 400 });
        }
        const user: User = { id: generateUserId(), name };
        users.push(user);
        return Response.json(user, { status: 201 });
      }

      if (method === "GET" && path === "/todos") {
        // Normalize output: trim whitespace from titles and attach assigned user
        return Response.json({
          todos: todos.map((t) => {
            const assignedUser = t.assignedToUserId
              ? findUserById(t.assignedToUserId) ?? null
              : null;
            return {
              ...t,
              title: t.title.trim(),
              assignedUser: assignedUser ? { id: assignedUser.id, name: assignedUser.name } : null,
            };
          }),
        });
      }

      if (method === "POST" && path === "/todos") {
        let body: { title?: string; category?: string; assignedToUserId?: string | null };
        try {
          body = await req.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }
        const title = typeof body?.title === "string" ? body.title.trim() : "";
        if (!title) {
          return Response.json({ error: "title is required" }, { status: 400 });
        }
        const category =
          typeof body?.category === "string" && body.category.trim()
            ? body.category.trim()
            : "General";
        const rawAssigned = body?.assignedToUserId;
        const assignedToUserId =
          rawAssigned === null || rawAssigned === undefined || rawAssigned === ""
            ? null
            : String(rawAssigned);
        if (assignedToUserId !== null && !findUserById(assignedToUserId)) {
          return Response.json({ error: "User not found" }, { status: 400 });
        }
        const todo: Todo = {
          id: generateTodoId(),
          title,
          category,
          completed: false,
          createdAt: new Date().toISOString(),
          assignedToUserId,
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
        let body: {
          title?: string;
          category?: string;
          assignedToUserId?: string | null;
          completed?: boolean;
        };
        try {
          body = await req.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }
        // Allow optional title update (preserve existing if omitted or null)
        if ("title" in body) todos[idx].title = body.title ?? todos[idx].title;
        if (typeof body?.category === "string" && body.category.trim())
          todos[idx].category = body.category.trim();
        if ("assignedToUserId" in body) {
          const raw = body.assignedToUserId;
          const uid =
            raw === null || raw === undefined || raw === "" ? null : String(raw);
          if (uid !== null && !findUserById(uid)) {
            return Response.json({ error: "User not found" }, { status: 400 });
          }
          todos[idx].assignedToUserId = uid;
        }
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
    } catch (err) {
      void coolKeeper.report(err instanceof Error ? err : String(err), { path, method });
      return Response.json(
        { error: err instanceof Error ? err.message : "Internal Server Error" },
        { status: 500 }
      );
    }
  },
});

console.log(`Todo list app listening on ${server.url}`);
