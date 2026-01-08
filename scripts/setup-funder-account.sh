#!/bin/bash
# Funder Account Setup Script
# Creates a complete funder/partner account using direct API/SQL

set -e

echo "🚀 Starting Funder Account Setup..."
echo ""

# Load environment
export DATABASE_URL="mysql://stampcoin:stampcoin123@localhost:3306/stampcoin"

# Function to execute MySQL commands via Docker
execute_sql() {
    docker exec stampcoin-mysql mysql -u stampcoin -pstampcoin123 stampcoin -e "$1"
}

# Function to execute MySQL query and get result via Docker
execute_sql_get() {
    docker exec stampcoin-mysql mysql -u stampcoin -pstampcoin123 stampcoin -se "$1"
}

# Verify database connection
echo "📝 Step 1: Verifying database connection..."
execute_sql "SELECT 1" > /dev/null 2>&1 && echo "   ✓ Database connection successful" || exit 1

# Funder Information
OPEN_ID="linkedin_azadzedan13_$(date +%s)"
EMAIL="azadzedan13@gmail.com"
NAME="Azad Zedan"
LOGIN_METHOD="linkedin"

COMPANY_NAME="Azad Zedan - Strategic Funder"
COMPANY_NAME_AR="أزاد زيدان - ممول استراتيجي"
DESCRIPTION="Strategic investor and founder with expertise in blockchain technology and digital assets. Supporting innovative projects in the stamp collecting and NFT ecosystem."
DESCRIPTION_AR="مستثمر استراتيجي ومؤسس متخصص في تكنولوجيا البلوكتشين والأصول الرقمية. يدعم المشاريع المبتكرة في النظام البيئي لجمع الطوابع و NFT."
WEBSITE="https://linkedin.com/in/azadzedan13"
TIER="platinum"
TOTAL_INVESTMENT="50000.00"
CONTACT_PERSON="Azad Zedan"
CONTACT_EMAIL="azadzedan13@gmail.com"
CONTACT_PHONE="+1 (555) 123-4567"

echo ""
echo "💼 Step 2: Setting up funder account..."
echo "   Email: $EMAIL"
echo "   Name: $NAME"
echo "   Company: $COMPANY_NAME"
echo "   Tier: ${TIER^^}"
echo "   Investment: \$$TOTAL_INVESTMENT"

# Check if user already exists
USER_ID=$(execute_sql_get "SELECT id FROM users WHERE email = '$EMAIL' LIMIT 1;" 2>/dev/null || echo "")

if [ -n "$USER_ID" ]; then
    echo "   ✓ User already exists (ID: $USER_ID)"
else
    echo "   → Creating new user account..."
    # Insert new user
    execute_sql "$(cat <<EOF_USER
INSERT INTO users (
  openId, 
  email, 
  name, 
  loginMethod, 
  role, 
  createdAt, 
  updatedAt, 
  lastSignedIn
) VALUES (
  '$OPEN_ID',
  '$EMAIL',
  '$NAME',
  '$LOGIN_METHOD',
  'user',
  NOW(),
  NOW(),
  NOW()
);
EOF_USER
)"
    USER_ID=$(execute_sql_get "SELECT LAST_INSERT_ID();")
    echo "   ✓ User created (ID: $USER_ID)"
fi

# Check if partner already exists
PARTNER_ID=$(execute_sql_get "SELECT id FROM partners WHERE userId = $USER_ID LIMIT 1;" 2>/dev/null || echo "")

if [ -n "$PARTNER_ID" ]; then
    echo "   ✓ Partner account already exists (ID: $PARTNER_ID)"
else
    echo "   → Creating partner/funder account..."
    # Insert new partner
    execute_sql "$(cat <<EOF_PARTNER
INSERT INTO partners (
  userId,
  companyName,
  companyNameAr,
  description,
  descriptionAr,
  website,
  tier,
  totalInvestment,
  status,
  contactPerson,
  contactEmail,
  contactPhone,
  investmentDate,
  createdAt,
  updatedAt
) VALUES (
  $USER_ID,
  '$COMPANY_NAME',
  '$COMPANY_NAME_AR',
  '$DESCRIPTION',
  '$DESCRIPTION_AR',
  '$WEBSITE',
  '$TIER',
  $TOTAL_INVESTMENT,
  'pending',
  '$CONTACT_PERSON',
  '$CONTACT_EMAIL',
  '$CONTACT_PHONE',
  NOW(),
  NOW(),
  NOW()
);
EOF_PARTNER
)"
    PARTNER_ID=$(execute_sql_get "SELECT LAST_INSERT_ID();")
    echo "   ✓ Partner account created (ID: $PARTNER_ID)"
fi

echo ""
echo "✅ Funder Account Setup Complete!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 ACCOUNT SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "👤 User Account:"
echo "   Email: $EMAIL"
echo "   Name: $NAME"
echo "   User ID: $USER_ID"
echo "   Login Method: $LOGIN_METHOD"
echo ""
echo "💼 Partner/Funder Account:"
echo "   Company: $COMPANY_NAME"
echo "   Tier: ${TIER^^}"
echo "   Investment: \$$TOTAL_INVESTMENT"
echo "   Status: PENDING (Awaiting admin approval)"
echo "   Partner ID: $PARTNER_ID"
echo ""
echo "🔗 LinkedIn & Web:"
echo "   LinkedIn: https://linkedin.com/in/azadzedan13"
echo "   Website: $WEBSITE"
echo ""
echo "📞 Contact Information:"
echo "   Contact Person: $CONTACT_PERSON"
echo "   Email: $CONTACT_EMAIL"
echo "   Phone: $CONTACT_PHONE"
echo ""
echo "💎 Partnership Benefits (Platinum Tier):"
echo "   ✓ \$25,000+ investment commitment"
echo "   ✓ 20% commission on referrals"
echo "   ✓ Premium features & branding"
echo "   ✓ 24/7 dedicated support"
echo "   ✓ Executive account management"
echo "   ✓ Custom integration options"
echo "   ✓ Analytics dashboard access"
echo "   ✓ Priority partnership opportunities"
echo "   ✓ Exclusive networking events"
echo "   ✓ Strategic partnership development"
echo ""
echo "📋 Next Steps:"
echo "   1. ✓ User account created"
echo "   2. ✓ Partner account created (pending approval)"
echo "   3. → Admin dashboard: Approve partnership application"
echo "   4. → Access partner dashboard: /partner-dashboard"
echo "   5. → Configure additional benefits and settings"
echo ""
echo "⚠️  Important Notes:"
echo "   • Account status is 'pending' - requires admin approval"
echo "   • Login using LinkedIn OAuth with this email"
echo "   • Admin will review and approve partnership application"
echo "   • Commission structure and benefits activate upon approval"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
