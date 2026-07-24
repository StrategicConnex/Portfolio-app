#!/bin/bash
# ===================================================
# Setup script for portfolio monitoring & deployment
# ===================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Portfolio Monitoring Setup Script${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check .env.local exists
if [ ! -f .env.local ]; then
  echo -e "${YELLOW}[WARN] .env.local not found. Copying from .env.example...${NC}"
  cp .env.example .env.local
  echo -e "${YELLOW}[WARN] Please edit .env.local with your API keys${NC}"
fi

# Check required env vars
required_vars=(
  "OPENROUTER_API_KEY:OpenRouter (AI Copilot)"
  "RESEND_API_KEY:Resend (Contact Form)"
  "CONTACT_TO_EMAIL:Contact Email"
)

echo -e "${GREEN}Checking required environment variables...${NC}"
missing_vars=0
for var_pair in "${required_vars[@]}"; do
  var_name="${var_pair%%:*}"
  var_desc="${var_pair##*:}"
  if grep -q "^${var_name}=." .env.local 2>/dev/null; then
    echo -e "  ${GREEN}✓${NC} $var_name ($var_desc)"
  else
    echo -e "  ${RED}✗${NC} $var_name ($var_desc) - MISSING"
    missing_vars=$((missing_vars + 1))
  fi
done

if [ $missing_vars -gt 0 ]; then
  echo -e "${YELLOW}[WARN] $missing_vars required variable(s) missing. Some features may not work.${NC}"
fi

echo ""
echo -e "${GREEN}Installing dependencies...${NC}"
npm install

echo ""
echo -e "${GREEN}Running pre-deploy verifications...${NC}"

# Lint
echo -n "  Running linter... "
if npm run lint 2>/dev/null >/dev/null; then
  echo -e "${GREEN}PASS${NC}"
else
  echo -e "${RED}FAIL${NC}"
fi

# Type check
echo -n "  Running type check... "
if npx tsc --noEmit 2>/dev/null >/dev/null; then
  echo -e "${GREEN}PASS${NC}"
else
  echo -e "${RED}FAIL${NC}"
fi

# Tests
echo -n "  Running tests... "
if npm run test 2>/dev/null >/dev/null; then
  echo -e "${GREEN}PASS${NC}"
else
  echo -e "${RED}FAIL${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Setup complete!${NC}"
echo -e "${GREEN}  Run 'npm run dev' to start locally${NC}"
echo -e "${GREEN}  Run 'npm run build' to build for production${NC}"
echo -e "${GREEN}========================================${NC}"
