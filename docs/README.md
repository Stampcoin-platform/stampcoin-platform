# Stampcoin Platform Documentation

## Security Documentation

### Command Execution Security

To prevent shell injection vulnerabilities, this project enforces secure command execution practices:

- **[Secure Command Execution Guidelines](SECURE_COMMAND_EXECUTION.md)** - Comprehensive guidelines on how to execute external commands safely
- **[Secure Command Examples](SECURE_COMMAND_EXAMPLES.md)** - Practical examples showing how to use the safe command utilities

**Key Principle:** Always use array-based arguments instead of string concatenation when executing commands.

```typescript
// ✅ SECURE
safeExecute('cat', ['file.txt'])

// ❌ INSECURE
exec(`cat ${filename}`)
```

### Quick Start

```typescript
import { safeExecute, safeSpawn } from './server/utils/safe-command';

// Execute a command
const result = await safeExecute('ls', ['-la', '/path']);
console.log(result.stdout);

// Execute with streaming output
const { promise } = safeSpawn('npm', ['install'], {
  onStdout: (data) => console.log(data),
});
await promise;
```

## Other Documentation

- [Investor Documentation](investor/) - Information for investors

## Contributing

When contributing code that executes external commands, please:
1. Read the [Secure Command Execution Guidelines](SECURE_COMMAND_EXECUTION.md)
2. Use the utilities from `server/utils/safe-command.ts`
3. Validate all user input before passing to commands
4. Add tests that verify security against injection attacks

## Security

For security issues, please see [SECURITY.md](../SECURITY.md) in the root directory.
