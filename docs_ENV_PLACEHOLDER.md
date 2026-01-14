```markdown
# .env.placeholder — how to use

This file is a safe placeholder template containing example environment variables.
Copy it locally, fill real values **locally only**, and never push real secrets.

Steps
1. Copy to working file:
   ```bash
   cp .env.placeholder .env
   ```
2. Edit `.env` and set real values (API keys, DB credentials, etc.).
3. Secure permissions (recommended):
   ```bash
   chmod 600 .env
   ```
4. Use platform/CI secrets (Render, Vercel, Railway, Fly, GitHub Actions) for production values.

Notes
- `.env` is already listed in `.gitignore` — do not commit it.
- Keep placeholders in repo for developer onboarding only.
- If any real secret is accidentally committed, rotate the secret immediately and remove it from Git history (see docs/SECRET_REMEDIATION.md).

Examples included in `.env.placeholder`:
- Server config (NODE_ENV, PORT)
- Database (DATABASE_URL)
- Session / JWT secrets
- Stripe, AWS, Pinata / nft.storage, blockchain keys (placeholders)
- Dev helpers (DEBUG, UPLOAD_DIR, MAX_FILE_SIZE)
```