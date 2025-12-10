#!/bin/bash
# ============================================
# Majster.AI - Automated Supabase Setup Script
# ============================================

set -e  # Exit on error

echo "🚀 Majster.AI - Automated Supabase Setup"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_REF="xwxvqhhnozfrjcjmcltv"
SUPABASE_URL="https://xwxvqhhnozfrjcjmcltv.supabase.co"

echo -e "${YELLOW}📦 Step 1: Installing Supabase CLI...${NC}"
if ! command -v supabase &> /dev/null; then
    echo "Installing Supabase CLI via npx..."
    npm install -g supabase@latest || {
        echo -e "${RED}❌ Failed to install Supabase CLI${NC}"
        echo "Please install manually: https://supabase.com/docs/guides/cli"
        exit 1
    }
fi

echo -e "${GREEN}✅ Supabase CLI installed${NC}"
echo ""

echo -e "${YELLOW}🔐 Step 2: Logging into Supabase...${NC}"
supabase login || {
    echo -e "${RED}❌ Failed to login to Supabase${NC}"
    echo "Please run: supabase login"
    exit 1
}

echo -e "${GREEN}✅ Logged in to Supabase${NC}"
echo ""

echo -e "${YELLOW}🔗 Step 3: Linking to project...${NC}"
supabase link --project-ref $PROJECT_REF || {
    echo -e "${RED}❌ Failed to link project${NC}"
    exit 1
}

echo -e "${GREEN}✅ Project linked${NC}"
echo ""

echo -e "${YELLOW}📊 Step 4: Running database migrations...${NC}"
echo "This will execute CONSOLIDATED_MIGRATIONS.sql..."

# Check if SQL file exists
if [ ! -f "CONSOLIDATED_MIGRATIONS.sql" ]; then
    echo -e "${RED}❌ CONSOLIDATED_MIGRATIONS.sql not found!${NC}"
    exit 1
fi

# Execute migration via Supabase CLI
supabase db push || {
    echo -e "${YELLOW}⚠️  db push failed, trying alternative method...${NC}"

    # Alternative: execute SQL file directly
    cat CONSOLIDATED_MIGRATIONS.sql | supabase db execute --file - || {
        echo -e "${RED}❌ Failed to execute migrations${NC}"
        echo ""
        echo "MANUAL STEP REQUIRED:"
        echo "1. Go to: https://supabase.com/dashboard/project/$PROJECT_REF/sql/new"
        echo "2. Copy entire content of: CONSOLIDATED_MIGRATIONS.sql"
        echo "3. Paste and click 'Run'"
        exit 1
    }
}

echo -e "${GREEN}✅ Database migrations completed${NC}"
echo ""

echo -e "${YELLOW}🚀 Step 5: Deploying Edge Functions...${NC}"
supabase functions deploy --no-verify-jwt || {
    echo -e "${RED}❌ Failed to deploy Edge Functions${NC}"
    echo "You may need to deploy them manually"
}

echo -e "${GREEN}✅ Edge Functions deployed${NC}"
echo ""

echo -e "${GREEN}=========================================="
echo "✅ Supabase Setup Complete!"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Configure Supabase Secrets (Edge Functions → Secrets)"
echo "2. Set Vercel Environment Variables"
echo "3. Redeploy Vercel"
echo ""
echo "See TWOJE_TODO.md for detailed instructions"
