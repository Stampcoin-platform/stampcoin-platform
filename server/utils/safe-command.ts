/**
 * Safe Command Execution Utilities
 * 
 * This module provides secure wrappers for executing external commands
 * following security best practices to prevent shell injection attacks.
 * 
 * @see docs/SECURE_COMMAND_EXECUTION.md for guidelines
 */

import { spawn, execFile, SpawnOptions, ExecFileOptions } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execFilePromise = promisify(execFile);

/**
 * Result of a command execution
 */
export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  error?: Error;
}

/**
 * Options for safe command execution
 */
export interface SafeCommandOptions {
  /** Working directory for the command */
  cwd?: string;
  /** Environment variables */
  env?: NodeJS.ProcessEnv;
  /** Maximum execution time in milliseconds */
  timeout?: number;
  /** Maximum buffer size for stdout/stderr */
  maxBuffer?: number;
}

/**
 * Validates that a command name contains only safe characters
 * 
 * @param command - The command to validate
 * @throws Error if command contains unsafe characters
 */
function validateCommand(command: string): void {
  // Allow alphanumeric, dash, underscore, dot, and forward slash (for paths)
  if (!/^[a-zA-Z0-9._/-]+$/.test(command)) {
    throw new Error(`Invalid command: "${command}". Command contains unsafe characters.`);
  }
}

/**
 * Validates command arguments
 * 
 * @param args - The arguments to validate
 * @throws Error if any argument is not a string
 */
function validateArguments(args: string[]): void {
  for (const arg of args) {
    if (typeof arg !== 'string') {
      throw new Error(`Invalid argument type: ${typeof arg}. All arguments must be strings.`);
    }
  }
}

/**
 * Sanitizes a file path to prevent directory traversal attacks
 * 
 * @param filePath - The file path to sanitize
 * @param baseDir - Optional base directory to restrict access
 * @returns Sanitized file path
 * @throws Error if path attempts directory traversal
 */
export function sanitizeFilePath(filePath: string, baseDir?: string): string {
  // Normalize the path to remove .. and .
  const normalized = path.normalize(filePath);
  
  // Check for directory traversal attempts
  if (normalized.includes('..')) {
    throw new Error(`Invalid file path: "${filePath}". Directory traversal detected.`);
  }
  
  // If a base directory is provided, ensure the path is within it
  if (baseDir) {
    const absoluteBase = path.resolve(baseDir);
    const absolutePath = path.resolve(absoluteBase, normalized);
    
    if (!absolutePath.startsWith(absoluteBase)) {
      throw new Error(`Invalid file path: "${filePath}". Path is outside base directory.`);
    }
    
    return absolutePath;
  }
  
  return normalized;
}

/**
 * Executes a command safely using array-based arguments
 * 
 * This is the recommended way to execute commands. It uses execFile
 * which does not spawn a shell, preventing shell injection attacks.
 * 
 * @example
 * ```typescript
 * const result = await safeExecute('cat', ['file.txt']);
 * console.log(result.stdout);
 * ```
 * 
 * @param command - The command to execute (e.g., 'cat', 'npm')
 * @param args - Array of arguments (e.g., ['file.txt'])
 * @param options - Execution options
 * @returns Promise resolving to command result
 */
export async function safeExecute(
  command: string,
  args: string[] = [],
  options: SafeCommandOptions = {}
): Promise<CommandResult> {
  validateCommand(command);
  validateArguments(args);
  
  const execOptions: ExecFileOptions = {
    cwd: options.cwd,
    env: options.env || process.env,
    timeout: options.timeout || 30000, // 30 second default timeout
    maxBuffer: options.maxBuffer || 1024 * 1024, // 1MB default buffer
    encoding: 'utf-8',
  };
  
  try {
    const { stdout, stderr } = await execFilePromise(command, args, execOptions);
    return {
      stdout: stdout as string,
      stderr: stderr as string,
      exitCode: 0,
    };
  } catch (error: any) {
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || '',
      exitCode: error.code || 1,
      error: error,
    };
  }
}

/**
 * Executes a command safely with streaming output
 * 
 * Use this when you need to process output as it arrives, or for long-running commands.
 * 
 * @example
 * ```typescript
 * const child = safeSpawn('npm', ['install', 'package-name'], {
 *   onStdout: (data) => console.log('Output:', data),
 *   onStderr: (data) => console.error('Error:', data),
 * });
 * 
 * await child.promise;
 * ```
 * 
 * @param command - The command to execute
 * @param args - Array of arguments
 * @param options - Execution options with streaming callbacks
 * @returns Object with process and promise
 */
export function safeSpawn(
  command: string,
  args: string[] = [],
  options: SafeCommandOptions & {
    onStdout?: (data: string) => void;
    onStderr?: (data: string) => void;
  } = {}
): { process: ReturnType<typeof spawn>; promise: Promise<CommandResult> } {
  validateCommand(command);
  validateArguments(args);
  
  const spawnOptions: SpawnOptions = {
    cwd: options.cwd,
    env: options.env || process.env,
    // Important: Do not set shell: true, which would enable shell injection
    shell: false,
  };
  
  const childProcess = spawn(command, args, spawnOptions);
  
  let stdout = '';
  let stderr = '';
  
  if (childProcess.stdout) {
    childProcess.stdout.on('data', (data) => {
      const str = data.toString();
      stdout += str;
      if (options.onStdout) {
        options.onStdout(str);
      }
    });
  }
  
  if (childProcess.stderr) {
    childProcess.stderr.on('data', (data) => {
      const str = data.toString();
      stderr += str;
      if (options.onStderr) {
        options.onStderr(str);
      }
    });
  }
  
  const promise = new Promise<CommandResult>((resolve, reject) => {
    let timeoutId: NodeJS.Timeout | undefined;
    
    if (options.timeout) {
      timeoutId = setTimeout(() => {
        childProcess.kill('SIGTERM');
        reject(new Error(`Command timed out after ${options.timeout}ms`));
      }, options.timeout);
    }
    
    childProcess.on('error', (error) => {
      if (timeoutId) clearTimeout(timeoutId);
      resolve({
        stdout,
        stderr,
        exitCode: null,
        error,
      });
    });
    
    childProcess.on('close', (code) => {
      if (timeoutId) clearTimeout(timeoutId);
      resolve({
        stdout,
        stderr,
        exitCode: code,
      });
    });
  });
  
  return {
    process: childProcess,
    promise,
  };
}

/**
 * Validates a package name for npm/pnpm commands
 * 
 * @param packageName - The package name to validate
 * @returns True if valid, false otherwise
 */
export function isValidPackageName(packageName: string): boolean {
  // npm package name rules:
  // - Must be lowercase
  // - Can contain alphanumeric, dash, underscore, dot, and @/ for scoped packages
  return /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(packageName);
}

/**
 * Validates a filename to prevent injection attacks
 * 
 * @param filename - The filename to validate
 * @returns True if valid, false otherwise
 */
export function isValidFilename(filename: string): boolean {
  // Allow alphanumeric, dash, underscore, dot
  // Disallow: .., /, \, and other special characters
  return /^[a-zA-Z0-9._-]+$/.test(filename) && !filename.includes('..');
}

/**
 * Escapes shell special characters in a string
 * 
 * Note: It's better to use array-based arguments than to rely on escaping.
 * This function is provided as a last resort.
 * 
 * @param str - The string to escape
 * @returns Escaped string
 */
export function escapeShellArg(str: string): string {
  // Escape single quotes and wrap in single quotes
  return `'${str.replace(/'/g, "'\\''")}'`;
}

/**
 * Example: Safe npm install
 * 
 * @param packageName - The package to install
 * @param options - Execution options
 * @returns Command result
 */
export async function safeNpmInstall(
  packageName: string,
  options: SafeCommandOptions = {}
): Promise<CommandResult> {
  if (!isValidPackageName(packageName)) {
    throw new Error(`Invalid package name: "${packageName}"`);
  }
  
  return safeExecute('npm', ['install', packageName], options);
}

/**
 * Example: Safe file reading
 * 
 * @param filename - The file to read
 * @param baseDir - Base directory to restrict access
 * @param options - Execution options
 * @returns Command result
 */
export async function safeReadFile(
  filename: string,
  baseDir?: string,
  options: SafeCommandOptions = {}
): Promise<CommandResult> {
  const safePath = sanitizeFilePath(filename, baseDir);
  return safeExecute('cat', [safePath], options);
}
