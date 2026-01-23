const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, "data.json");
const SYNC_TOKEN = process.env.SYNC_TOKEN || "";

function readData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}
function writeData(todos) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(todos, null, 2), "utf8");
    return true;
  } catch (e) {
    console.error("Write error:", e);
    return false;
  }
}

function requireToken(req, res, next) {
  const auth = req.get("Authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!SYNC_TOKEN || token !== SYNC_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

app.get("/sync", requireToken, (req, res) => {
  const todos = readData();
  res.json({ todos });
});

app.post("/sync", requireToken, (req, res) => {
  const payload = req.body;
  if (!payload || !Array.isArray(payload.todos)) {
    return res.status(400).json({ error: "Invalid payload, expected { todos: [...] }" });
  }
  const ok = writeData(payload.todos);
  if (!ok) return res.status(500).json({ error: "Failed to store data" });
  res.json({ ok: true });
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`todo-sync-backend listening on port ${port}`);
});