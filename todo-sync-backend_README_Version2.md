# Minimal todo-sync backend

Run locally:

1. Set SYNC_TOKEN env var: `export SYNC_TOKEN=your_token` (Windows: `setx SYNC_TOKEN "your_token"`), or:
   - PowerShell: `$env:SYNC_TOKEN = "your_token"`
2. npm install
3. npm start

API:

- GET /sync  (Authorization: Bearer <SYNC_TOKEN>) -> { todos: [...] }
- POST /sync (Authorization: Bearer <SYNC_TOKEN>) with body { todos: [...] } -> { ok: true }

This is an MVP; secure and add per-user storage for production.