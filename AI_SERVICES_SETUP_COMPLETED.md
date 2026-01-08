# AI Authentication Services Setup ✅

## Overview
Configure AI vision services for stamp forgery detection and authentication.

## Step 1: Google Cloud Vision API Setup

### Get API Key:
1. Go to https://console.cloud.google.com
2. Create a new project or select existing
3. Enable **Cloud Vision API**:
   - Search for "Vision API"
   - Click **Enable**
4. Create API Key:
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **API Key**
   - Copy the API key

### Add to .env:
```bash
GOOGLE_VISION_API_KEY=your_google_vision_api_key_here
```

### Free Tier:
- 1,000 requests/month (free)
- $1.50 per 1,000 requests after

## Step 2: Azure Computer Vision Setup

### Get Azure Credentials:
1. Go to https://portal.azure.com
2. Create a new resource
3. Search for "Computer Vision"
4. Click **Create**
5. Configure:
   - Resource Group: Create new
   - Region: East US (free tier available)
   - Pricing tier: Free (F0) or Standard (S1)
6. After deployment:
   - Go to **Keys and Endpoint**
   - Copy **Key 1** and **Endpoint**

### Add to .env:
```bash
AZURE_VISION_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
AZURE_VISION_KEY=your_azure_vision_key_here
```

### Pricing:
- Free tier: 5,000 requests/month
- Paid: $1-$1.50 per 1,000 requests

## Step 3: OpenAI Setup (Optional - for AI Analysis)

### Get OpenAI API Key:
1. Go to https://platform.openai.com
2. Sign in or create account
3. Go to **API keys**
4. Click **Create new secret key**
5. Copy the key (starts with `sk-`)

### Add to .env:
```bash
OPENAI_API_KEY=sk_your_openai_api_key_here
```

### Pricing:
- GPT-4: $0.03/1K input tokens, $0.06/1K output
- GPT-3.5: $0.0005/1K input, $0.0015/1K output

## Step 4: Implementation in Code

The AI services are integrated at:
```
server/routes/authentication.ts
  └── /api/authenticate/verify-stamp
      - Uses Google Vision or Azure Vision
      - Analyzes stamp image for forgery
      - Returns authenticity score (0-100%)
```

### Use in your app:
```typescript
// Verify stamp authenticity
POST /api/authenticate/verify-stamp
{
  "stampId": 123,
  "imageUrl": "https://...",
  "provider": "google" | "azure"
}

Response:
{
  "authentic": true,
  "confidence": 0.95,
  "details": {
    "colorAnalysis": 0.94,
    "paperQuality": 0.96,
    "stampsPattern": 0.95
  }
}
```

## Step 5: Configure in Application

Add to your `.env` file:

```bash
# ============================================
# AI SERVICES (For Stamp Authentication)
# ============================================

# Google Cloud Vision API
GOOGLE_VISION_API_KEY=your_api_key_here

# Azure Computer Vision
AZURE_VISION_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
AZURE_VISION_KEY=your_api_key_here

# OpenAI (Optional)
OPENAI_API_KEY=sk_your_api_key_here
```

## Service Comparison

| Service | Free Tier | Features | Best For |
|---------|-----------|----------|----------|
| **Google Vision** | 1,000/month | Label detection, text recognition | General purpose |
| **Azure Vision** | 5,000/month | Faces, OCR, color analysis | Professional grade |
| **OpenAI** | Pay-as-you-go | Advanced analysis, descriptions | Complex analysis |

## Authentication Workflow

1. **Upload Stamp Image**
   - User uploads stamp photo
   - Stored in S3 (via `/api/upload`)

2. **Analyze with Vision API**
   - Extract visual features
   - Analyze color, texture, aging
   - Check for forgery patterns

3. **Generate Score**
   - Authenticity: 0-100%
   - Confidence: High/Medium/Low
   - Return detailed report

4. **Store Result**
   - Save to database
   - Link to stamp NFT
   - Create audit trail

## Testing

### Test Google Vision:
```bash
curl -X POST "https://vision.googleapis.com/v1/images:annotate?key=YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "requests": [{
      "image": {"source": {"imageUri": "https://..."}},
      "features": [{"type": "LABEL_DETECTION"}]
    }]
  }'
```

### Test Azure Vision:
```bash
curl -X POST "https://YOUR_RESOURCE.cognitiveservices.azure.com/vision/v3.2/analyze?visualFeatures=Color,Objects" \
  -H "Ocp-Apim-Subscription-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://..."}'
```

## Cost Optimization

1. **Cache Results**: Store analysis results to avoid duplicate API calls
2. **Batch Processing**: Use batch APIs for bulk analysis
3. **Use Free Tiers**: Google (1K/mo), Azure (5K/mo)
4. **Selective Processing**: Only analyze high-value stamps
5. **Monitor Usage**: Set up billing alerts

## Security Best Practices

⚠️ **IMPORTANT:**
- Never commit `.env` with real keys
- Use IAM roles in production
- Rotate API keys regularly
- Enable API key restrictions
- Monitor for suspicious activity

## Troubleshooting

### "Invalid API Key" Error
- Check key format
- Verify key hasn't expired
- Ensure key has correct permissions
- Check API is enabled

### "Rate Limit Exceeded"
- Implement exponential backoff
- Use higher tier plan
- Cache results
- Batch requests

### "Unsupported Media Type"
- Ensure image format is supported (JPEG, PNG, GIF, WebP)
- Check image size (<20MB recommended)
- Verify image URL is accessible

## Resources

- **Google Cloud Vision**: https://cloud.google.com/vision/docs
- **Azure Computer Vision**: https://docs.microsoft.com/en-us/azure/cognitive-services/computer-vision/
- **OpenAI API**: https://platform.openai.com/docs/api-reference

## Next Steps

1. ✅ Create free accounts for Vision APIs
2. ✅ Add API keys to `.env`
3. ✅ Test authentication endpoint
4. ✅ Monitor API usage and costs
5. ✅ Consider upgrading to paid tiers if needed
