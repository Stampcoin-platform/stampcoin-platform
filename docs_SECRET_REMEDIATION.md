```markdown
# Secret remediation guide

If a secret/key was accidentally committed, follow these steps immediately.

1) Rotate the secret in the provider dashboard (Stripe, AWS, OpenAI, Pinata, etc.)
   - Revoke the key and create a new one.
   - Update your CI / hosting secrets with the new key.

2) Remove the secret from Git history (choose one method)

Option A — Use BFG Repo-Cleaner (simpler)
- Install BFG: https://rtyley.github.io/bfg-repo-cleaner/
```bash
# make a bare mirror
git clone --mirror https://github.com/<owner>/<repo>.git
cd <repo>.git

# create passwords.txt with exact secrets or regex replacements
# Example file contents:
# secret_to_remove
bfg --replace-text passwords.txt

# push cleaned history (force)
git push --force
```
- After rewriting history, ask all collaborators to reclone.

Option B — Use git-filter-repo (recommended modern tool)
- Install: pip install git-filter-repo
```bash
git clone --mirror https://github.com/<owner>/<repo>.git
cd <repo>.git

# Create a replacements file (one per line):
# literal-secret==REDACTED
cat > replacements.txt <<'EOF'
supersecret123==REDACTED
EOF

git filter-repo --replace-text replacements.txt

# push changes:
git push origin --force --all
git push origin --force --tags
```

3) Revoke & rotate keys (again) — done immediately after removal to ensure any leaked copy is invalid.

4) Notify team & CI:
- Inform collaborators to reclone.
- Update any CI / deploy secrets with the new keys.
- Re-run secrets scan to confirm removal.

5) Prevent future leaks:
- Ensure `.gitignore` contains `.env` (already present).
- Enable GitHub secret scanning / Advanced Security for the repo (Settings → Security & analysis).
- Add pre-commit hooks that run gitleaks or similar locally (e.g., via pre-commit).
```