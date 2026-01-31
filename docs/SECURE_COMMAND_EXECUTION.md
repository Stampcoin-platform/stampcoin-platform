# Secure Command Execution Guidelines

## Overview

This document outlines the security best practices for executing external commands in the Stampcoin Platform. Following these guidelines helps prevent shell injection vulnerabilities and other command execution attacks.

## The Problem: Shell Injection

When constructing commands using string concatenation or interpolation, user input can potentially inject malicious commands:

```javascript
// ❌ INSECURE - Vulnerable to shell injection
const { exec } = require('child_process');
const filename = userInput; // Could be "file.txt; rm -rf /"
exec(`cat ${filename}`, (error, stdout) => {
  console.log(stdout);
});
```

## The Solution: Array-Based Arguments

Always use array-based arguments to separate the command from its arguments. This prevents the shell from interpreting special characters in arguments as commands.

### Node.js Best Practices

#### 1. Use `spawn` or `execFile` with Array Arguments

```javascript
// ✅ SECURE - Array-based arguments
const { spawn } = require('child_process');

// Good: Arguments are passed as an array
const child = spawn('cat', [filename]);

child.stdout.on('data', (data) => {
  console.log(data.toString());
});
```

```javascript
// ✅ SECURE - Using execFile
const { execFile } = require('child_process');

execFile('cat', [filename], (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  console.log(stdout);
});
```

#### 2. Avoid `exec` and `execSync` with String Commands

```javascript
// ❌ INSECURE - String concatenation
const { exec } = require('child_process');
exec(`program ${arg1} ${arg2}`, callback);

// ✅ SECURE - Use spawn with array
const { spawn } = require('child_process');
spawn('program', [arg1, arg2]);
```

#### 3. If You Must Use `exec`, Validate and Sanitize

```javascript
const { exec } = require('child_process');
const path = require('path');

// Validate input
if (!/^[a-zA-Z0-9_.-]+$/.test(filename)) {
  throw new Error('Invalid filename');
}

// Use path.join to prevent directory traversal
const safePath = path.join(safeDirectory, path.basename(filename));

exec(`cat "${safePath}"`, callback);
```

## Cross-Language Examples

### Ruby (Reference from Problem Statement)

```ruby
# ✅ SECURE - Array-based arguments
system('program', 'with arguments')                     
out = IO.popen(['program', 'with arguments'], &:read)

# In a Rakefile
sh "ruby", "program.rb", somearg
```

### Python

```python
# ✅ SECURE - Array-based arguments
import subprocess

# Good: List of arguments
subprocess.run(['program', 'with', 'arguments'])

# Also good: Using list with shell=False (default)
result = subprocess.run(['cat', filename], capture_output=True)
```

### Shell Scripts

```bash
# ✅ SECURE - Quoted variables
filename="$1"
cat "$filename"

# ❌ INSECURE - Unquoted variable
cat $filename
```

## Stampcoin Platform Guidelines

### For TypeScript/JavaScript Code

1. **Import the right module**
   ```typescript
   import { spawn, execFile } from 'child_process';
   // Avoid: import { exec, execSync } from 'child_process';
   ```

2. **Always use array arguments**
   ```typescript
   // ✅ Good
   const process = spawn('npm', ['install', packageName]);
   
   // ❌ Bad
   exec(`npm install ${packageName}`);
   ```

3. **Validate all external input**
   ```typescript
   function isValidPackageName(name: string): boolean {
     return /^[@a-z0-9-~][a-z0-9-._~]*$/.test(name);
   }
   
   if (!isValidPackageName(packageName)) {
     throw new Error('Invalid package name');
   }
   ```

### For Shell Scripts

1. **Quote all variables**
   ```bash
   # ✅ Good
   file="$1"
   cat "$file"
   
   # ❌ Bad
   cat $1
   ```

2. **Use arrays for complex commands**
   ```bash
   # ✅ Good
   args=("$file1" "$file2" "$file3")
   command "${args[@]}"
   ```

3. **Validate input in shell**
   ```bash
   if [[ ! "$filename" =~ ^[a-zA-Z0-9._-]+$ ]]; then
     echo "Invalid filename"
     exit 1
   fi
   ```

## Testing for Security

### 1. Unit Tests

Create tests that verify commands are constructed safely:

```typescript
import { describe, it, expect } from 'vitest';
import { buildCommand } from './command-builder';

describe('Command Builder', () => {
  it('should escape special characters', () => {
    const args = buildCommand('cat', ['file; rm -rf /']);
    expect(args).toEqual(['cat', 'file; rm -rf /']);
    // The semicolon is treated as part of the filename, not a command separator
  });
});
```

### 2. Integration Tests

Test with malicious input to ensure it's handled safely:

```typescript
it('should not execute injected commands', async () => {
  const maliciousInput = 'file.txt && echo "HACKED"';
  const result = await safeExecute('cat', [maliciousInput]);
  
  // Should fail to find file, not execute the echo command
  expect(result.error).toBeDefined();
  expect(result.output).not.toContain('HACKED');
});
```

## Code Review Checklist

When reviewing code that executes commands:

- [ ] Are array-based arguments used instead of string concatenation?
- [ ] Is all external input validated before use?
- [ ] Are variables properly quoted in shell scripts?
- [ ] Are there tests covering malicious input?
- [ ] Is the `shell: true` option avoided in `spawn`?
- [ ] Are file paths validated to prevent directory traversal?
- [ ] Are environment variables properly sanitized?

## Additional Security Resources

- [OWASP Command Injection](https://owasp.org/www-community/attacks/Command_Injection)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [CWE-78: OS Command Injection](https://cwe.mitre.org/data/definitions/78.html)

## Reporting Security Issues

If you discover a command injection vulnerability or any other security issue, please report it to:
- Email: security@stampcoin.platform
- See: [SECURITY.md](../SECURITY.md)

---

**Last Updated:** 2026-01-10  
**Status:** ✅ Active Guidelines
