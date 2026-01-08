import 'dotenv/config';
import axios from 'axios';

async function main() {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) {
    console.error('❌ PINATA_JWT is not set in .env');
    process.exit(1);
  }

  const payload = {
    pinataMetadata: {
      name: 'stampcoin-ipfs-test',
      keyvalues: { app: 'stampcoin', env: process.env.NODE_ENV || 'development' },
    },
    pinataOptions: { cidVersion: 1 },
    pinataContent: {
      name: 'StampCoin IPFS Connectivity Test',
      description: 'Verifying Pinata JWT and IPFS upload from StampCoin platform.',
      timestamp: new Date().toISOString(),
    },
  };

  try {
    console.log('📦 Uploading test JSON to Pinata (IPFS)...');
    const res = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', payload, {
      headers: { Authorization: `Bearer ${jwt}` },
      timeout: 20000,
    });
    const cid = res.data.IpfsHash;
    console.log('✅ Upload success. CID:', cid);
    console.log('🔗 Gateway URL:', `https://gateway.pinata.cloud/ipfs/${cid}`);
  } catch (err: any) {
    console.error('❌ Upload failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

main();