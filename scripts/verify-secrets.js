#!/usr/bin/env node

/**
 * Secrets Verification Script
 * 
 * This script scans the codebase to ensure no secrets are hardcoded in plaintext.
 * It checks for common secret patterns and validates that .env.example exists.
 * 
 * Run this script as part of CI/CD to prevent accidental secret commits.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// Patterns that indicate potential secrets
const SECRET_PATTERNS = [
  // API Keys
  /['"]?[A-Z_]*API[_]?KEY['"]?\s*[:=]\s*['"][A-Za-z0-9_-]{20,}['"]/i,
  /['"]?[A-Z_]*SECRET[_]?KEY['"]?\s*[:=]\s*['"][A-Za-z0-9_-]{20,}['"]/i,
  /['"]?[A-Z_]*ACCESS[_]?KEY['"]?\s*[:=]\s*['"]AKIA[A-Z0-9]{16}['"]/,
  
  // Tokens
  /['"]?[A-Z_]*TOKEN['"]?\s*[:=]\s*['"][A-Za-z0-9_-]{20,}['"]/i,
  /['"]?JWT['"]?\s*[:=]\s*['"]eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+['"]/,
  
  // Stripe keys
  /sk_live_[A-Za-z0-9]{24,}/,
  /pk_live_[A-Za-z0-9]{24,}/,
  /whsec_[A-Za-z0-9]{32,}/,
  
  // Private keys
  /['"]?PRIVATE[_]?KEY['"]?\s*[:=]\s*['"](?!your_|example|test|dummy|changeme)[A-Fa-f0-9]{64}['"]/i,
  
  // Database URLs with credentials
  /['"]?DATABASE[_]?URL['"]?\s*[:=]\s*['"](mysql|postgresql|mongodb):\/\/[^:]+:[^@]+@[^/]+/i,
  
  // Pinata
  /['"]?PINATA[_]?JWT['"]?\s*[:=]\s*['"]eyJ[A-Za-z0-9_-]+/i,
  
  // NFT.Storage
  /['"]?NFT[_]?STORAGE[_]?API[_]?KEY['"]?\s*[:=]\s*['"]eyJ[A-Za-z0-9_-]+/i,
  
  // AWS
  /AKIA[A-Z0-9]{16}/,
  
  // Generic secrets (not in .env files)
  /(?<!example|test|dummy|your_|placeholder|changeme)[A-Za-z0-9+/]{40,}={0,2}/
];

// Files and directories to exclude from scanning
const EXCLUDE_PATTERNS = [
  /node_modules/,
  /\.git/,
  /dist/,
  /build/,
  /coverage/,
  /\.next/,
  /\.vercel/,
  /\.env\.example/,
  /\.env\.local\.example/,
  /\.env\.production\.example/,
  /\.env\.deployment\.example/,
  /package-lock\.json/,
  /pnpm-lock\.yaml/,
  /yarn\.lock/,
  /\.log$/,
  /\.md$/,
  /\.txt$/,
  /\.json$/,
  /\.sh$/,
  /verify-secrets\.js$/,
  /README_DEPLOY\.md$/,
  /badges/,
  /\.backup/,
  /\.bak$/,
  /backups/,
  /contracts/,
  /artifacts/,
  /cache/,
  /typechain-types/,
  /patches/,
  /\.sol$/
];

// Safe patterns that look like secrets but aren't
const SAFE_PATTERNS = [
  /['"]?[A-Z_]*['"]?\s*[:=]\s*['"]your_/i,
  /['"]?[A-Z_]*['"]?\s*[:=]\s*['"]example/i,
  /['"]?[A-Z_]*['"]?\s*[:=]\s*['"]test_/i,
  /['"]?[A-Z_]*['"]?\s*[:=]\s*['"]dummy/i,
  /['"]?[A-Z_]*['"]?\s*[:=]\s*['"]changeme/i,
  /['"]?[A-Z_]*['"]?\s*[:=]\s*['"]placeholder/i,
  /['"]?[A-Z_]*['"]?\s*[:=]\s*['"]sk_test_/i,
  /['"]?[A-Z_]*['"]?\s*[:=]\s*['"]pk_test_/i,
  // Ethereum addresses (40 hex chars with 0x prefix)
  /0x[0-9a-fA-F]{40}/,
  // URLs (not secrets)
  /https?:\/\//,
  // Path-like strings
  /\/[a-zA-Z0-9_.-]+\//,
  // Generic patterns with "0x" that are likely addresses, not private keys
  /['"]?[a-z]+['"]?\s*[:=]\s*['"]0x[0-9a-fA-F]{40}/i,
];

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function shouldExclude(filePath) {
  return EXCLUDE_PATTERNS.some(pattern => pattern.test(filePath));
}

function isSafePattern(line) {
  return SAFE_PATTERNS.some(pattern => pattern.test(line));
}

function scanFile(filePath) {
  const issues = [];
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Skip if it's a safe pattern (example/test values)
      if (isSafePattern(line)) {
        return;
      }
      
      // Check for secret patterns
      SECRET_PATTERNS.forEach(pattern => {
        if (pattern.test(line)) {
          issues.push({
            file: filePath,
            line: index + 1,
            content: line.trim().substring(0, 80) // Limit display length
          });
        }
      });
    });
  } catch (error) {
    // Skip files that can't be read
    if (error.code !== 'EISDIR') {
      log(`Warning: Could not read file ${filePath}: ${error.message}`, 'yellow');
    }
  }
  
  return issues;
}

function scanDirectory(dir) {
  let allIssues = [];
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (shouldExclude(fullPath)) {
        continue;
      }
      
      if (entry.isDirectory()) {
        allIssues = allIssues.concat(scanDirectory(fullPath));
      } else if (entry.isFile()) {
        const issues = scanFile(fullPath);
        allIssues = allIssues.concat(issues);
      }
    }
  } catch (error) {
    log(`Warning: Could not scan directory ${dir}: ${error.message}`, 'yellow');
  }
  
  return allIssues;
}

function checkEnvExampleExists() {
  const envExamplePath = path.join(rootDir, '.env.example');
  
  if (!fs.existsSync(envExamplePath)) {
    log('✗ .env.example file not found!', 'red');
    return false;
  }
  
  log('✓ .env.example file exists', 'green');
  return true;
}

function verifyEnvExampleContent() {
  const envExamplePath = path.join(rootDir, '.env.example');
  
  try {
    const content = fs.readFileSync(envExamplePath, 'utf8');
    const requiredVars = [
      'NFT_STORAGE_API_KEY',
      'PINATA_API_KEY',
      'PINATA_JWT',
      'VERCEL_TOKEN',
      'FLY_API_TOKEN',
      'RAILWAY_TOKEN'
    ];
    
    const missingVars = [];
    
    for (const varName of requiredVars) {
      if (!content.includes(varName)) {
        missingVars.push(varName);
      }
    }
    
    if (missingVars.length > 0) {
      log('✗ Missing environment variables in .env.example:', 'red');
      missingVars.forEach(v => log(`  - ${v}`, 'red'));
      return false;
    }
    
    log('✓ All required environment variables present in .env.example', 'green');
    return true;
  } catch (error) {
    log(`Error reading .env.example: ${error.message}`, 'red');
    return false;
  }
}

function main() {
  log('\n🔍 Starting secrets verification...\n', 'blue');
  
  // Check .env.example exists
  log('Checking .env.example file...', 'blue');
  const envExampleExists = checkEnvExampleExists();
  
  // Verify .env.example content
  const envExampleValid = verifyEnvExampleContent();
  
  // Scan for hardcoded secrets
  log('\nScanning for hardcoded secrets...', 'blue');
  const issues = scanDirectory(rootDir);
  
  // Report results
  log('\n' + '='.repeat(80), 'blue');
  log('VERIFICATION RESULTS', 'blue');
  log('='.repeat(80) + '\n', 'blue');
  
  if (!envExampleExists || !envExampleValid) {
    log('✗ Environment configuration validation failed', 'red');
  }
  
  if (issues.length === 0) {
    log('✓ No hardcoded secrets detected', 'green');
  } else {
    log(`✗ Found ${issues.length} potential secret(s):\n`, 'red');
    
    issues.forEach(issue => {
      log(`File: ${issue.file}`, 'yellow');
      log(`Line: ${issue.line}`, 'yellow');
      log(`Content: ${issue.content}`, 'yellow');
      log('---', 'yellow');
    });
  }
  
  log('\n' + '='.repeat(80) + '\n', 'blue');
  
  // Exit with error if issues found
  if (!envExampleExists || !envExampleValid || issues.length > 0) {
    log('❌ Verification failed! Please fix the issues above.', 'red');
    process.exit(1);
  } else {
    log('✅ All checks passed! No secrets detected.', 'green');
    process.exit(0);
  }
}

// Run the script
main();
