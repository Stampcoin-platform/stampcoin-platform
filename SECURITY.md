# Security Policy

## Reporting a Vulnerability
If you discover a security issue, please email us at security@stampcoin.platform. We will respond as quickly as possible and coordinate a fix.

Please include:
- A clear description of the issue and potential impact
- Steps to reproduce (if applicable)
- Any proof-of-concept code or logs

We kindly ask you to not create public issues for vulnerabilities prior to coordinated disclosure.

## Scope
- Server (Express + tRPC)
- Frontend (React)
- Database (Drizzle + MySQL)
- Smart contracts and integrations (Polygon/IPFS)

## Best Practices Followed
- Type-safe APIs via tRPC
- Input validation via Zod
- Secrets via environment variables
- Principle of least privilege for cloud/storage
- CI checks for typing, tests, and coverage
- CodeQL security analysis (GitHub Actions)
- **Secure command execution** - Array-based arguments to prevent shell injection ([guidelines](docs/SECURE_COMMAND_EXECUTION.md))

## Secure Command Execution

This project follows strict guidelines for executing external commands to prevent shell injection attacks. All command execution must use array-based arguments instead of string concatenation.

See [Secure Command Execution Guidelines](docs/SECURE_COMMAND_EXECUTION.md) for detailed information.

**Quick Reference:**
- ✅ Use `safeExecute('cat', ['file.txt'])` from `server/utils/safe-command.ts`
- ❌ Never use `exec(\`cat ${filename}\`)`
- ✅ Use `spawn('npm', ['install', packageName])`
- ❌ Never use `exec(\`npm install ${packageName}\`)`
