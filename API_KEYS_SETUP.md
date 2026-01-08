# 🔑 API Keys Setup - Quick Guide

## ✅ Step 1: Pinata (IPFS Storage)
**Time**: 5 minutes

1. Go to https://pinata.cloud
2. Click "Sign Up" (use email or GitHub)
3. Verify email
4. Dashboard → **API Keys** (left menu)
5. Click **"Create New"**
6. Name: `StampCoin-Platform`
7. Permissions: Select all
8. Copy these values to `.env`:

```bash
PINATA_API_KEY=your_api_key_here
PINATA_API_SECRET=your_api_secret_here
PINATA_JWT=your_jwt_token_here
```

---

## ✅ Step 2: nft.storage (NFT Metadata)
**Time**: 5 minutes

1. Go to https://nft.storage
2. Click **Sign In** → Select **GitHub**
3. Authorize application
4. Dashboard → **API Tokens**
5. Click **Create new token**
6. Name: `StampCoin`
7. Copy the token to `.env`:

```bash
NFT_STORAGE_API_KEY=your_nft_storage_token_here
```

---

## ✅ Step 3: Google Cloud Vision
**Time**: 10 minutes

1. Go to https://console.cloud.google.com
2. Create new project: `StampCoin`
3. Search for "Vision API" → Click **Enable**
4. Go to **Credentials** (left sidebar)
5. Click **Create Credentials** → **API Key**
6. Copy to `.env`:

```bash
GOOGLE_VISION_API_KEY=your_google_api_key_here
```

**Free Tier**: 1,000 requests/month

---

## ✅ Step 4: Azure Computer Vision
**Time**: 10 minutes

1. Go to https://portal.azure.com
2. Click **Create a resource**
3. Search for "Computer Vision" → Click **Create**
4. Fill in:
   - **Name**: `stampcoin-vision`
   - **Region**: East US (has free tier)
   - **Pricing**: Free (F0) tier
5. Click **Review + Create** → **Create**
6. Wait for deployment (1-2 minutes)
7. Go to resource → **Keys and Endpoint**
8. Copy to `.env`:

```bash
AZURE_VISION_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
AZURE_VISION_KEY=your_azure_key_here
```

**Free Tier**: 5,000 requests/month

---

## ✅ Step 5: OpenAI (Optional)
**Time**: 5 minutes

1. Go to https://platform.openai.com
2. Sign in (or create account)
3. Click **API keys** (left menu)
4. Click **Create new secret key**
5. Copy to `.env`:

```bash
OPENAI_API_KEY=sk_your_openai_key_here
```

---

## ✅ Update .env File

Open `/workspaces/Stampcoin-platform/.env` and add:

```bash
# IPFS Storage
PINATA_API_KEY=YOUR_PINATA_API_KEY
PINATA_API_SECRET=YOUR_PINATA_API_SECRET
PINATA_JWT=YOUR_PINATA_JWT

# NFT Storage
NFT_STORAGE_API_KEY=YOUR_NFT_STORAGE_KEY

# AI Services
GOOGLE_VISION_API_KEY=YOUR_GOOGLE_API_KEY
AZURE_VISION_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
AZURE_VISION_KEY=YOUR_AZURE_KEY
OPENAI_API_KEY=sk_YOUR_OPENAI_KEY
```

---

## ✅ Verify Setup

Run this command to test:

```bash
curl -X GET "http://localhost:3000/api/health"
```

You should see: `{"status":"ok"}`

---

## 💰 Total Cost (First Month)
- **Pinata**: Free (1GB)
- **nft.storage**: Free (unlimited!)
- **Google Vision**: Free (1K requests)
- **Azure Vision**: Free (5K requests)
- **OpenAI**: Pay-as-you-go ($0.001-0.01 per request)

**Total**: ~$0 if you stay under free tiers! 🎉

---

## ⚠️ Security Tips

1. **Never commit .env to Git!**
2. **Use separate keys for prod/dev**
3. **Rotate keys monthly**
4. **Set usage limits** (especially OpenAI)
5. **Use IAM roles** (not API keys) in production

---

**Once you've added all keys, reply with: "Keys added!" and I'll verify everything works.**
