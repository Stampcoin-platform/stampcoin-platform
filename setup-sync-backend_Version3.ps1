<#
Creates todo-sync-backend files, branch feat/todo-sync-backend, commits and pushes.
Run from repository root in PowerShell.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$flyAppName = Read-Host "Enter Fly app name for backend (default: stampcoin-todo-sync)"
if ([string]::IsNullOrWhiteSpace($flyAppName)) { $flyAppName = "stampcoin-todo-sync" }

$branch = "feat/todo-sync-backend"
$commitMessage = "feat(todo): add minimal sync backend (Express)"

function Write-NoBOM {
    param($Path, $Content)
    $full = (Resolve-Path $Path).ProviderPath
    $enc = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($full, $Content, $enc)
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error "git not found. Install git and re-run."
    exit 1
}

New-Item -ItemType Directory -Force -Path "todo-sync-backend" | Out-Null

# server.js
$serverJs = @'
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
'@

Write-NoBOM ".\todo-sync-backend\server.js" $serverJs

# package.json
$pkgJson = @'
{
  "name": "todo-sync-backend",
  "version": "0.1.0",
  "private": true,
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.18.2"
  }
}
'@
Write-NoBOM ".\todo-sync-backend\package.json" $pkgJson

# Dockerfile
$docker = @'
FROM node:18-alpine
WORKDIR /usr/src/app
COPY package.json package-lock.json* ./
RUN npm ci --production || npm install --omit=dev
COPY . .
EXPOSE 8080
CMD ["node", "server.js"]
'@
Write-NoBOM ".\todo-sync-backend\Dockerfile" $docker

# fly.toml
$fly = @"
app = ""$flyAppName""
primary_region = "ord"

[env]
  SYNC_TOKEN = ""
"@
Write-NoBOM ".\todo-sync-backend\fly.toml" $fly

# README
$readme = @'
# Minimal todo-sync backend

Run locally:

1. Set SYNC_TOKEN env var: `export SYNC_TOKEN=your_token` (Windows: `setx SYNC_TOKEN "your_token"`)
2. npm install
3. npm start

API:

- GET /sync  (Authorization: Bearer <SYNC_TOKEN>) -> { todos: [...] }
- POST /sync (Authorization: Bearer <SYNC_TOKEN>) with body { todos: [...] } -> { ok: true }

This is an MVP; secure and add per-user storage for production.
'@
Write-NoBOM ".\todo-sync-backend\README.md" $readme

# Git actions
Write-Host "Creating branch $branch..."
git checkout -b $branch

git add todo-sync-backend
git commit -m $commitMessage

try {
    git push -u origin $branch
    Write-Host "Branch pushed: $branch"
} catch {
    Write-Warning "Push failed. Ensure remote 'origin' exists and you have push permissions."
}

$owner = "Stampcoin-platform"
$repo = "stampcoin-platform"
$compareUrl = "https://github.com/$owner/$repo/compare/main...$branch?expand=1"
Write-Host ""
Write-Host "Open this URL to create the PR in your browser:"
Write-Host $compareUrl