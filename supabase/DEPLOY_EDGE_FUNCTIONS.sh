#!/bin/bash
# Deployment script for Supabase Edge Functions
# Majster.AI Production Deployment
# Project Ref: xwvxqhhnozfrjcjmcltv

set -e  # Exit on error

echo "🚀 Majster.AI Edge Functions Deployment"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found${NC}"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

echo -e "${GREEN}✅ Supabase CLI found${NC}"
echo ""

# Check if already logged in
echo "Checking Supabase authentication..."
if ! supabase projects list &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Supabase${NC}"
    echo "Running: supabase login"
    supabase login
else
    echo -e "${GREEN}✅ Already logged in${NC}"
fi
echo ""

# Check if project is linked
echo "Checking project link..."
if [ ! -f ".supabase/config.toml" ]; then
    echo -e "${YELLOW}⚠️  Project not linked${NC}"
    echo "Linking project: xwvxqhhnozfrjcjmcltv"
    supabase link --project-ref xwvxqhhnozfrjcjmcltv
else
    echo -e "${GREEN}✅ Project already linked${NC}"
fi
echo ""

# List of all Edge Functions to deploy
FUNCTIONS=(
    "ai-chat-agent"
    "ai-quote-suggestions"
    "analyze-photo"
    "approve-offer"
    "cleanup-expired-data"
    "create-checkout-session"
    "csp-report"
    "delete-user-account"
    "finance-ai-analysis"
    "healthcheck"
    "ocr-invoice"
    "public-api"
    "send-expiring-offer-reminders"
    "send-offer-email"
    "stripe-webhook"
    "voice-quote-processor"
)

echo "📦 Deploying ${#FUNCTIONS[@]} Edge Functions..."
echo ""

# Deploy each function
DEPLOYED=0
FAILED=0

for func in "${FUNCTIONS[@]}"; do
    echo -e "${YELLOW}Deploying: $func${NC}"

    if supabase functions deploy "$func" --no-verify-jwt; then
        echo -e "${GREEN}✅ $func deployed successfully${NC}"
        ((DEPLOYED++))
    else
        echo -e "${RED}❌ Failed to deploy $func${NC}"
        ((FAILED++))
    fi
    echo ""
done

# Summary
echo "========================================"
echo "Deployment Summary:"
echo -e "${GREEN}✅ Deployed: $DEPLOYED${NC}"
if [ $FAILED -gt 0 ]; then
    echo -e "${RED}❌ Failed: $FAILED${NC}"
fi
echo ""

# Verify healthcheck
echo "🔍 Verifying deployment..."
HEALTHCHECK_URL="https://xwvxqhhnozfrjcjmcltv.supabase.co/functions/v1/healthcheck"
echo "Testing: $HEALTHCHECK_URL"

if curl -s -f "$HEALTHCHECK_URL" | grep -q "ok"; then
    echo -e "${GREEN}✅ Healthcheck passed!${NC}"
else
    echo -e "${RED}❌ Healthcheck failed${NC}"
    echo "This might be normal if secrets are not configured yet."
fi
echo ""

# Next steps
echo "========================================"
echo "✅ Edge Functions Deployment Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Configure secrets in Supabase Dashboard"
echo "   Dashboard → Edge Functions → Secrets"
echo ""
echo "2. Required secrets (see SECRETS_CHECKLIST.md):"
echo "   - SUPABASE_URL"
echo "   - SUPABASE_SERVICE_ROLE_KEY"
echo "   - FRONTEND_URL"
echo "   - RESEND_API_KEY"
echo "   - OPENAI_API_KEY (or ANTHROPIC_API_KEY or GEMINI_API_KEY)"
echo "   - STRIPE_SECRET_KEY"
echo "   - STRIPE_WEBHOOK_SECRET"
echo ""
echo "3. Test your functions:"
echo "   curl $HEALTHCHECK_URL"
echo ""
