# IPFS Storage Setup Guide ✅

## Overview
This guide will help you configure IPFS storage for NFT metadata using Pinata and nft.storage.

## Step 1: Pinata Setup (Recommended for Images)

### Get Pinata API Keys:
1. Go to https://pinata.cloud
2. Sign up for a free account
3. Navigate to **API Keys** section
4. Click **Create New**
5. Choose **Admin** or **Custom** permissions
6. Copy the following:
   - `API Key`
   - `API Secret`
   - `JWT Token` (if available)

### Add to .env:
```bash
PINATA_API_KEY=your_pinata_api_key_here
PINATA_API_SECRET=your_pinata_api_secret_here
PINATA_JWT=your_jwt_token_here
```

## Step 2: nft.storage Setup (Alternative for Metadata)

### Get nft.storage API Key:
1. Go to https://nft.storage
2. Sign in with GitHub
3. Click **API Keys** in the menu
4. Click **Create New Key**
5. Copy the API key

### Add to .env:
```bash
NFT_STORAGE_API_KEY=your_nft_storage_api_key_here
```

## Step 3: Configure in Application

The IPFS integration is already built into the system at:
- `server/_core/storage/ipfs.ts` - IPFS client
- `server/routes/nft.ts` - NFT minting with IPFS

### Upload NFT Metadata:
```bash
# The system automatically uploads to IPFS when minting NFTs
POST /api/nft/mint
{
  "stampId": 123,
  "to": "0x...",
  "metadata": {
    "name": "Stamp Name",
    "description": "...",
    "image": "ipfs://..."
  }
}
```

## Step 4: Verify Setup

```bash
# Test IPFS connectivity
curl -X GET "https://gateway.pinata.cloud/ipfs/YOUR_HASH"

# Test nft.storage (if configured)
curl -X GET "https://nft.storage/ipfs/YOUR_HASH"
```

## Cost Comparison

| Service | Free Tier | Paid Plans | Best For |
|---------|-----------|-----------|----------|
| **Pinata** | 1GB storage | $29/mo (100GB) | Production NFT images |
| **nft.storage** | Unlimited (free)* | Free forever! | Metadata & small files |
| **Arweave** | Pay-per-use | $1-5/GB | Permanent storage |

*Powered by Filecoin and IPFS

## Security Notes

⚠️ **NEVER commit .env with real keys to Git!**

Add to `.gitignore`:
```
.env
.env.local
.env.production
```

## Next Steps

1. ✅ Get API keys from Pinata and nft.storage
2. ✅ Add keys to your `.env` file
3. ✅ Test NFT minting with `POST /api/nft/mint`
4. ✅ Monitor storage usage in dashboards

## Troubleshooting

### "401 Unauthorized" on Pinata
- Check API key format (should not include quotes)
- Verify API key hasn't expired
- Ensure JWT token is valid

### "403 Forbidden" on nft.storage
- Verify API key in headers: `Authorization: Bearer YOUR_KEY`
- Check if key has upload permissions

### Upload Timeout
- Use Pinata for large files (>5MB)
- Use nft.storage for metadata (<100KB)
- Test with smaller files first

## Resources

- **Pinata Docs**: https://docs.pinata.cloud
- **nft.storage Docs**: https://nft.storage/docs/
- **IPFS Gateway**: https://gateway.pinata.cloud
- **Example IPFS URI**: `ipfs://QmXx...` or `https://gateway.pinata.cloud/ipfs/QmXx...`
