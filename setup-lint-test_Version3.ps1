<#
Creates lint/test files for todo-app, branch chore/todo-lint-test, commits and pushes.
Run from repository root in PowerShell.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$branch = "chore/todo-lint-test"
$commitMessage = "chore(todo): add ESLint and Jest with CI for todo-app"

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

# Ensure directories
New-Item -ItemType Directory -Force -Path "todo-app" | Out-Null
New-Item -ItemType Directory -Force -Path "todo-app\__tests__" | Out-Null
New-Item -ItemType Directory -Force -Path ".github\workflows" | Out-Null

# package.json
$pkg = @'
{
  "name": "todo-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "lint": "eslint . --ext .js",
    "test": "jest --coverage"
  },
  "devDependencies": {
    "eslint": "^8.48.0",
    "jest": "^29.6.2"
  }
}
'@
Write-NoBOM ".\todo-app\package.json" $pkg

# .eslintrc.json
$eslintrc = @'
{
  "env": {
    "browser": true,
    "es2021": true,
    "node": true
  },
  "extends": "eslint:recommended",
  "parserOptions": {
    "ecmaVersion": 2021,
    "sourceType": "module"
  },
  "rules": {
    "no-unused-vars": ["warn"],
    "no-console": ["off"]
  }
}
'@
Write-NoBOM ".\.eslintrc.json" $eslintrc

# jest.config.cjs
$jest = @'
module.exports = {
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.js?(x)", "**/?(*.)+(spec|test).js?(x)"]
};
'@
Write-NoBOM ".\jest.config.cjs" $jest

# simple test
$test = @'
const fs = require("fs");
test("package.json exists in todo-app", () => {
  const exists = fs.existsSync("todo-app/package.json");
  expect(exists).toBe(true);
});
'@
Write-NoBOM ".\todo-app\__tests__\app.test.js" $test

# workflow
$workflow = @'
name: Test & Lint Todo App

on:
  push:
    branches:
      - main
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Use Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install deps
        working-directory: ./todo-app
        run: npm ci
      - name: Run linter
        working-directory: ./todo-app
        run: npm run lint
      - name: Run tests
        working-directory: ./todo-app
        run: npm test
'@
Write-NoBOM ".\.github\workflows\test-todo-app.yml" $workflow

# Git operations
Write-Host "Creating branch $branch..."
git checkout -b $branch

git add todo-app package.json jest.config.cjs .eslintrc.json .github\workflows\test-todo-app.yml
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