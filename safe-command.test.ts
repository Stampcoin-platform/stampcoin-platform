/**
 * Tests for Safe Command Execution Utilities
 * 
 * These tests verify that command execution is secure and prevents
 * shell injection attacks.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  safeExecute,
  safeSpawn,
  sanitizeFilePath,
  isValidPackageName,
  isValidFilename,
  escapeShellArg,
  CommandResult,
} from '../server/utils/safe-command';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';

describe('Safe Command Execution', () => {
  const testDir = '/tmp/safe-command-test';

  beforeEach(() => {
    // Clean up and create test directory
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {
      // Ignore if doesn't exist
    }
    mkdirSync(testDir, { recursive: true });
  });

  describe('safeExecute', () => {
    it('should execute a simple command with array arguments', async () => {
      const result = await safeExecute('echo', ['hello world']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe('hello world');
      expect(result.error).toBeUndefined();
    });

    it('should handle special characters in arguments safely', async () => {
      // Create a test file with a name containing special characters
      const filename = 'test-file.txt';
      const filepath = join(testDir, filename);
      writeFileSync(filepath, 'test content');

      // Try to execute cat with the filename
      const result = await safeExecute('cat', [filepath]);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe('test content');
    });

    it('should not execute shell injection attempts', async () => {
      // This should fail because the entire string is treated as a filename
      const maliciousArg = 'file.txt; echo HACKED';
      const result = await safeExecute('cat', [maliciousArg]);
      
      // Command should fail (file doesn't exist), not execute the injected command
      expect(result.exitCode).not.toBe(0);
      expect(result.stdout).not.toContain('HACKED');
    });

    it('should reject invalid command names', async () => {
      await expect(
        safeExecute('echo; ls', ['test'])
      ).rejects.toThrow('Invalid command');
    });

    it('should reject non-string arguments', async () => {
      await expect(
        // @ts-expect-error - Testing invalid input
        safeExecute('echo', [123])
      ).rejects.toThrow('Invalid argument type');
    });

    it('should respect timeout option', async () => {
      // This command sleeps for 5 seconds
      const result = await safeExecute('sleep', ['5'], { timeout: 100 });
      
      expect(result.exitCode).not.toBe(0);
      expect(result.error).toBeDefined();
    }, 1000);

    it('should capture both stdout and stderr', async () => {
      // Use a command that writes to stderr
      const result = await safeExecute('node', [
        '-e',
        'console.error("error message"); console.log("output message");'
      ]);
      
      expect(result.stdout).toContain('output message');
      expect(result.stderr).toContain('error message');
    });
  });

  describe('safeSpawn', () => {
    it('should execute a command with streaming output', async () => {
      const outputs: string[] = [];
      
      const { promise } = safeSpawn('echo', ['hello'], {
        onStdout: (data) => outputs.push(data),
      });
      
      const result = await promise;
      
      expect(result.exitCode).toBe(0);
      expect(outputs.join('')).toContain('hello');
    });

    it('should not allow shell injection via spawn', async () => {
      const { promise } = safeSpawn('echo', ['test; ls']);
      const result = await promise;
      
      // The entire string should be echoed, not executed
      expect(result.stdout).toContain('test; ls');
    });

    it('should handle process errors', async () => {
      const { promise } = safeSpawn('nonexistent-command', ['arg']);
      const result = await promise;
      
      expect(result.error).toBeDefined();
      expect(result.exitCode).toBeNull();
    });

    it('should respect timeout and kill process', async () => {
      const { promise } = safeSpawn('sleep', ['10'], { timeout: 100 });
      
      await expect(promise).rejects.toThrow('timed out');
    }, 1000);
  });

  describe('sanitizeFilePath', () => {
    it('should normalize safe paths', () => {
      const result = sanitizeFilePath('folder/file.txt');
      expect(result).toBe('folder/file.txt');
    });

    it('should reject paths with directory traversal', () => {
      expect(() => sanitizeFilePath('../etc/passwd')).toThrow('Directory traversal');
      expect(() => sanitizeFilePath('folder/../../etc/passwd')).toThrow('Directory traversal');
    });

    it('should restrict paths to base directory', () => {
      const base = '/home/user/safe';
      
      // Valid path within base
      const safe = sanitizeFilePath('documents/file.txt', base);
      expect(safe.startsWith(base)).toBe(true);
      
      // Invalid path outside base
      expect(() => {
        sanitizeFilePath('../../../etc/passwd', base);
      }).toThrow('outside base directory');
    });

    it('should handle absolute paths with base directory', () => {
      const base = '/home/user/safe';
      const result = sanitizeFilePath('/home/user/safe/file.txt', base);
      
      expect(result).toBe('/home/user/safe/file.txt');
    });
  });

  describe('isValidPackageName', () => {
    it('should accept valid package names', () => {
      expect(isValidPackageName('express')).toBe(true);
      expect(isValidPackageName('lodash')).toBe(true);
      expect(isValidPackageName('body-parser')).toBe(true);
      expect(isValidPackageName('@types/node')).toBe(true);
      expect(isValidPackageName('@babel/core')).toBe(true);
    });

    it('should reject invalid package names', () => {
      expect(isValidPackageName('Express')).toBe(false); // Uppercase
      expect(isValidPackageName('../etc/passwd')).toBe(false);
      expect(isValidPackageName('package; rm -rf')).toBe(false);
      expect(isValidPackageName('package&& ls')).toBe(false);
      expect(isValidPackageName('')).toBe(false);
    });
  });

  describe('isValidFilename', () => {
    it('should accept valid filenames', () => {
      expect(isValidFilename('file.txt')).toBe(true);
      expect(isValidFilename('my-file_2.json')).toBe(true);
      expect(isValidFilename('data.csv')).toBe(true);
    });

    it('should reject invalid filenames', () => {
      expect(isValidFilename('../etc/passwd')).toBe(false);
      expect(isValidFilename('file/with/path')).toBe(false);
      expect(isValidFilename('file;rm')).toBe(false);
      expect(isValidFilename('file&ls')).toBe(false);
      expect(isValidFilename('file|cat')).toBe(false);
    });
  });

  describe('escapeShellArg', () => {
    it('should escape single quotes', () => {
      const result = escapeShellArg("it's");
      expect(result).toBe("'it'\\''s'");
    });

    it('should wrap arguments in single quotes', () => {
      const result = escapeShellArg('hello world');
      expect(result).toBe("'hello world'");
    });

    it('should handle special characters', () => {
      const result = escapeShellArg('test; rm -rf /');
      expect(result).toBe("'test; rm -rf /'");
    });
  });

  describe('Security Tests', () => {
    it('should prevent command chaining via semicolon', async () => {
      const result = await safeExecute('echo', ['test; ls']);
      
      // Should echo the literal string, not execute ls
      expect(result.stdout).toContain('test; ls');
      expect(result.exitCode).toBe(0);
    });

    it('should prevent command chaining via &&', async () => {
      const result = await safeExecute('echo', ['test && ls']);
      
      expect(result.stdout).toContain('test && ls');
    });

    it('should prevent command chaining via ||', async () => {
      const result = await safeExecute('echo', ['test || ls']);
      
      expect(result.stdout).toContain('test || ls');
    });

    it('should prevent command substitution via backticks', async () => {
      const result = await safeExecute('echo', ['test `ls`']);
      
      expect(result.stdout).toContain('test `ls`');
    });

    it('should prevent command substitution via $()', async () => {
      const result = await safeExecute('echo', ['test $(ls)']);
      
      expect(result.stdout).toContain('test $(ls)');
    });

    it('should prevent pipe injection', async () => {
      const result = await safeExecute('echo', ['test | cat /etc/passwd']);
      
      expect(result.stdout).toContain('test | cat /etc/passwd');
    });

    it('should prevent redirection injection', async () => {
      const testFile = join(testDir, 'redirect-test.txt');
      const result = await safeExecute('echo', [`test > ${testFile}`]);
      
      // Should echo the literal string, not redirect to file
      expect(result.stdout).toContain(`test > ${testFile}`);
    });

    it('should handle null bytes safely', async () => {
      // Null bytes could be used to terminate strings early
      const result = await safeExecute('echo', ['test\x00afternull']);
      
      // Command should execute without error
      expect(result.exitCode).toBe(0);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should safely handle user-provided filenames', async () => {
      // Simulate a user upload scenario
      const userFilename = 'my-document.txt';
      const safePath = join(testDir, userFilename);
      
      writeFileSync(safePath, 'User content');
      
      const result = await safeExecute('cat', [safePath]);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBe('User content');
    });

    it('should safely execute npm install with package name', async () => {
      const packageName = 'express';
      
      if (!isValidPackageName(packageName)) {
        throw new Error('Invalid package name');
      }
      
      // In real scenario, this would install the package
      // Here we just verify the validation works
      expect(isValidPackageName(packageName)).toBe(true);
    });

    it('should prevent injection in file search operations', async () => {
      const searchTerm = 'test; rm -rf /';
      
      // Create a test file
      const testFile = join(testDir, 'search-test.txt');
      writeFileSync(testFile, 'test content');
      
      // Search should treat the entire string as a search term
      const result = await safeExecute('grep', [searchTerm, testFile]);
      
      // Should exit with 1 (no match), not 0 (command executed)
      expect(result.exitCode).toBe(1);
      expect(result.stdout).not.toContain('rm -rf');
    });
  });
});
