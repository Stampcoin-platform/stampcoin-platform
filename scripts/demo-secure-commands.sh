#!/bin/bash

# Demonstration of Secure Command Execution Patterns
# This script shows how to safely execute commands in shell scripts

set -e

echo "======================================================"
echo "  Secure Command Execution - Shell Script Demo"
echo "======================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Rule #1: Always quote variables${NC}"
echo ""

# ✅ SECURE: Quoted variables
safe_filename="test file.txt"
echo -e "${GREEN}✅ SECURE:${NC} cat \"\$filename\""
# cat "$safe_filename"  # Would work if file existed

# ❌ INSECURE: Unquoted variable
echo -e "${RED}❌ INSECURE:${NC} cat \$filename (without quotes)"
echo "   If filename contains spaces or special chars, this breaks"
echo ""

echo -e "${YELLOW}Rule #2: Validate input before use${NC}"
echo ""

validate_filename() {
  local filename="$1"
  
  # Check for directory traversal
  if [[ "$filename" == *".."* ]]; then
    echo -e "${RED}❌ REJECTED:${NC} Directory traversal detected in: $filename"
    return 1
  fi
  
  # Check for path separators
  if [[ "$filename" == *"/"* ]]; then
    echo -e "${RED}❌ REJECTED:${NC} Path separator detected in: $filename"
    return 1
  fi
  
  # Check for shell special characters
  if [[ "$filename" =~ [';|&$`\\<>'] ]]; then
    echo -e "${RED}❌ REJECTED:${NC} Special characters detected in: $filename"
    return 1
  fi
  
  echo -e "${GREEN}✅ VALID:${NC} $filename"
  return 0
}

# Test validation
echo "Testing filename validation:"
validate_filename "document.txt" || true
validate_filename "../../../etc/passwd" || true
validate_filename "file; rm -rf /" || true
validate_filename "data|cat" || true
echo ""

echo -e "${YELLOW}Rule #3: Use arrays for complex commands${NC}"
echo ""

# ✅ SECURE: Using arrays
echo -e "${GREEN}✅ SECURE:${NC} Using bash arrays"
files=("file1.txt" "file 2.txt" "file3.txt")
echo "Processing files: ${files[*]}"

# Iterate safely
for file in "${files[@]}"; do
  echo "  - Would process: $file"
done
echo ""

echo -e "${YELLOW}Rule #4: Avoid eval${NC}"
echo ""

# ❌ INSECURE: Using eval
unsafe_command="echo 'test'"
echo -e "${RED}❌ INSECURE:${NC} eval \"\$unsafe_command\""
echo "   This allows arbitrary command execution"
echo ""

# ✅ SECURE: Direct execution with validation
echo -e "${GREEN}✅ SECURE:${NC} Direct command execution after validation"
echo "   Only execute known, validated commands"
echo ""

echo -e "${YELLOW}Rule #5: Use command substitution safely${NC}"
echo ""

# ✅ SECURE: Command substitution with \$()
current_date=$(date +%Y-%m-%d)
echo -e "${GREEN}✅ SECURE:${NC} date=\$(date +%Y-%m-%d) → $current_date"
echo ""

# Show the difference
echo -e "${YELLOW}Comparison: Backticks vs \$(...)${NC}"
echo "Old style (backticks):  \`command\`  - Harder to nest, less readable"
echo "Modern style (\$(...)):  \$(command) - Easier to nest, more readable"
echo ""

echo "======================================================"
echo "  Summary"
echo "======================================================"
echo ""
echo -e "${GREEN}✅ DO:${NC}"
echo "  1. Always quote variables: \"\$var\""
echo "  2. Validate all input"
echo "  3. Use arrays for lists"
echo "  4. Use \$(...) for command substitution"
echo "  5. Check for special characters"
echo ""
echo -e "${RED}❌ DON'T:${NC}"
echo "  1. Don't use unquoted variables"
echo "  2. Don't use eval with user input"
echo "  3. Don't trust any external input"
echo "  4. Don't use backticks (use \$() instead)"
echo "  5. Don't allow directory traversal"
echo ""
echo "For more information, see:"
echo "  - docs/SECURE_COMMAND_EXECUTION.md"
echo "  - docs/SECURE_COMMAND_EXAMPLES.md"
echo ""
