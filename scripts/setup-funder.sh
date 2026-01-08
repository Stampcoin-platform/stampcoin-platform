#!/bin/bash
# Funder Account Setup Script - Direct SQL Execution

set -e

echo "🚀 Starting Funder Account Setup..."
echo ""

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

echo "📝 Step 1: Verifying database connection..."
docker exec stampcoin-mysql mysql -u stampcoin -pstampcoin123 stampcoin -e "SELECT 1" > /dev/null 2>&1 && echo "   ✓ Database connection successful" || exit 1

echo ""
echo "💼 Step 2: Setting up funder account..."
echo "   Email: $EMAIL"
echo "   Name: $NAME"
echo "   Company: $COMPANY_NAME"
echo "   Tier: ${TIER^^}"
echo "   Investment: \$$TOTAL_INVESTMENT"
echo ""

# Create SQL script
SQL_SCRIPT=$(cat <<'EOF'
-- Check and create user
SELECT @user_id := id FROM users WHERE email = 'TEMP_EMAIL' LIMIT 1;

-- If user doesn't exist, create it
INSERT INTO users (openId, email, name, loginMethod, role, createdAt, updatedAt, lastSignedIn)
SELECT 'TEMP_OPEN_ID', 'TEMP_EMAIL', 'TEMP_NAME', 'TEMP_LOGIN', 'user', NOW(), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'TEMP_EMAIL');

-- Get user ID (insert or existing)
SELECT @user_id := id FROM users WHERE email = 'TEMP_EMAIL' LIMIT 1;

-- Check if partner exists
SELECT @partner_exists := COUNT(*) FROM partners WHERE userId = @user_id;

-- If partner doesn't exist, create it
INSERT INTO partners (
  userId, companyName, companyNameAr, description, descriptionAr, website,
  tier, totalInvestment, status, contactPerson, contactEmail, contactPhone,
  investmentDate, createdAt, updatedAt
)
SELECT @user_id, 'TEMP_COMPANY', 'TEMP_COMPANY_AR', 'TEMP_DESC', 'TEMP_DESC_AR', 'TEMP_WEB',
  'TEMP_TIER', TEMP_INVEST, 'pending', 'TEMP_PERSON', 'TEMP_EMAIL_CONTACT', 'TEMP_PHONE',
  NOW(), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM partners WHERE userId = @user_id);

-- Show result
SELECT u.id as user_id, u.email, p.id as partner_id, p.companyName, p.tier, p.status
FROM users u
LEFT JOIN partners p ON p.userId = u.id
WHERE u.email = 'TEMP_EMAIL';
EOF
)

# Replace placeholders
SQL_SCRIPT="${SQL_SCRIPT//TEMP_EMAIL/$EMAIL}"
SQL_SCRIPT="${SQL_SCRIPT//TEMP_OPEN_ID/$OPEN_ID}"
SQL_SCRIPT="${SQL_SCRIPT//TEMP_NAME/$NAME}"
SQL_SCRIPT="${SQL_SCRIPT//TEMP_LOGIN/$LOGIN_METHOD}"
SQL_SCRIPT="${SQL_SCRIPT//TEMP_COMPANY/$COMPANY_NAME}"
SQL_SCRIPT="${SQL_SCRIPT//TEMP_COMPANY_AR/$COMPANY_NAME_AR}"
SQL_SCRIPT="${SQL_SCRIPT//TEMP_DESC/$DESCRIPTION}"
SQL_SCRIPT="${SQL_SCRIPT//TEMP_DESC_AR/$DESCRIPTION_AR}"
SQL_SCRIPT="${SQL_SCRIPT//TEMP_WEB/$WEBSITE}"
SQL_SCRIPT="${SQL_SCRIPT//TEMP_TIER/$TIER}"
SQL_SCRIPT="${SQL_SCRIPT//TEMP_INVEST/$TOTAL_INVESTMENT}"
SQL_SCRIPT="${SQL_SCRIPT//TEMP_PERSON/$CONTACT_PERSON}"
SQL_SCRIPT="${SQL_SCRIPT//TEMP_EMAIL_CONTACT/$CONTACT_EMAIL}"
SQL_SCRIPT="${SQL_SCRIPT//TEMP_PHONE/$CONTACT_PHONE}"

# Execute SQL
echo "   → Creating/updating accounts..."
RESULT=$(docker exec stampcoin-mysql mysql -u stampcoin -pstampcoin123 stampcoin -e "$SQL_SCRIPT" 2>&1 | tail -2)

USER_ID=$(echo "$RESULT" | head -1 | awk '{print $1}')
PARTNER_ID=$(echo "$RESULT" | head -1 | awk '{print $3}')

echo "   ✓ Account setup completed"
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
echo "   Investment: \$50,000.00"
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
echo "🎯 Quick Links:"
echo "   🔗 LinkedIn: https://linkedin.com/in/azadzedan13"
echo "   📧 Contact: azadzedan13@gmail.com"
echo "   🌐 Platform: http://localhost:5173"
echo ""
echo "⚠️  Important Notes:"
echo "   • Account status is 'pending' - requires admin approval"
echo "   • Login using LinkedIn OAuth with this email"
echo "   • Admin will review and approve partnership application"
echo "   • Commission structure and benefits activate upon approval"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
