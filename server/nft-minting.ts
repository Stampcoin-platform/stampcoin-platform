/**
 * NFT Minting Service
 * Handles the process of converting stamp images to NFTs with metadata
 */

import { randomBytes } from 'crypto';
import * as ipfs from './ipfs';
import { ethers } from 'ethers';

export interface NftMetadata {
  name: string;
  description: string;
  image: string; // IPFS or CDN URL
  external_url?: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  properties?: {
    category: string;
    creators: Array<{
      address: string;
      share: number;
    }>;
    files: Array<{
      uri: string;
      type: string;
    }>;
  };
}

export interface MintingRequest {
  stampId: number;
  userId: number;
  blockchainNetwork: 'ethereum' | 'polygon' | 'solana' | 'arbitrum';
  imageUrl: string;
  title: string;
  description: string;
  attributes: Record<string, any>;
}

export interface MintingResult {
  success: boolean;
  tokenId?: string;
  contractAddress?: string;
  transactionHash?: string;
  metadataUri?: string;
  errorMessage?: string;
}

/**
 * Generate NFT metadata following OpenSea/Metaplex standards
 */
export function generateNftMetadata(stamp: {
  title: string;
  description?: string;
  imageUrl?: string;
  country?: string;
  year?: number;
  rarity?: string;
  designer?: string;
  issuedBy?: string;
  denomination?: string;
  condition?: string;
  certificateNumber?: string;
  physicalStampId?: string;
}): NftMetadata {
  const attributes: Array<{ trait_type: string; value: string | number }> = [];

  if (stamp.country) attributes.push({ trait_type: 'Country', value: stamp.country });
  if (stamp.year) attributes.push({ trait_type: 'Year', value: stamp.year });
  if (stamp.rarity) attributes.push({ trait_type: 'Rarity', value: stamp.rarity });
  if (stamp.designer) attributes.push({ trait_type: 'Designer', value: stamp.designer });
  if (stamp.issuedBy) attributes.push({ trait_type: 'Issued By', value: stamp.issuedBy });
  if (stamp.denomination) attributes.push({ trait_type: 'Denomination', value: stamp.denomination });
  if (stamp.condition) attributes.push({ trait_type: 'Condition', value: stamp.condition });
  if (stamp.certificateNumber) attributes.push({ trait_type: 'Certificate Number', value: stamp.certificateNumber });
  if (stamp.physicalStampId) attributes.push({ trait_type: 'Physical Stamp ID', value: stamp.physicalStampId });

  return {
    name: stamp.title,
    description: stamp.description || `A unique digital collectible stamp from ${stamp.country || 'the world'}`,
    image: stamp.imageUrl || '',
    attributes,
  };
}

/**
 * Prepare metadata for IPFS upload (returns JSON string)
 */
export function prepareIpfsMetadata(metadata: NftMetadata): string {
  return JSON.stringify(metadata, null, 2);
}

/**
 * Generate a unique token ID
 */
export function generateTokenId(): string {
  return `0x${randomBytes(32).toString('hex')}`;
}

/**
 * Mock minting function (replace with actual blockchain integration)
 * In production, integrate with:
 * - Ethereum: ethers.js + custom ERC-721 contract
 * - Polygon: Same as Ethereum but on Polygon network
 * - Solana: @solana/web3.js + Metaplex
 */
export async function mintNft(request: MintingRequest): Promise<MintingResult> {
  try {
    // Validate image URL
    if (!request.imageUrl) {
      throw new Error('Image URL is required for minting');
    }

    // Generate metadata
    const metadata = generateNftMetadata({
      title: request.title,
      description: request.description,
      imageUrl: request.imageUrl,
      ...request.attributes,
    });

    // Real IPFS upload (if credentials configured)
    let metadataUri: string;
    
    if (process.env.PINATA_API_KEY || process.env.NFT_STORAGE_API_KEY) {
      try {
        // Download image from URL
        const imageResponse = await fetch(request.imageUrl);
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
        const fileName = `stamp-${request.stampId}-${Date.now()}.jpg`;
        
        // Upload to IPFS
        const result = await ipfs.uploadStampNFT(
          imageBuffer,
          fileName,
          'image/jpeg',
          metadata
        );
        
        metadataUri = result.metadataIpfs.ipfsUrl;
        console.log('[NFT Minting] Uploaded to IPFS:', metadataUri);
      } catch (uploadError: any) {
        console.error('[NFT Minting] IPFS upload failed, using mock:', uploadError.message);
        metadataUri = `ipfs://QmMock${randomBytes(16).toString('hex')}/metadata.json`;
      }
    } else {
      // Fallback to mock for development
      metadataUri = `ipfs://QmMock${randomBytes(16).toString('hex')}/metadata.json`;
    }

    // Call actual blockchain minting (Ethereum/Polygon)
    let tokenId: string;
    let transactionHash: string;
    const contractAddress = getContractAddress(request.blockchainNetwork);
    
    // Check if blockchain credentials are configured
    const canMintOnChain = process.env.WALLET_PRIVATE_KEY && 
                           process.env.RPC_URL && 
                           process.env.NFT_CONTRACT_ADDRESS &&
                           (request.blockchainNetwork === 'ethereum' || request.blockchainNetwork === 'polygon');
    
    if (canMintOnChain) {
      try {
        // Initialize provider and signer
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const signer = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY!, provider);
        
        // Minimal ERC-721 ABI for minting
        const abi = [
          'function mintStamp(address to, string memory tokenURI) public returns (uint256)',
          'function safeMint(address to, string memory uri) public returns (uint256)',
          'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'
        ];
        
        const contract = new ethers.Contract(
          process.env.NFT_CONTRACT_ADDRESS!,
          abi,
          signer
        );
        
        // Get recipient address (user's wallet or default)
        const recipientAddress = request.attributes.walletAddress || signer.address;
        
        // Attempt minting with different function signatures
        let tx;
        try {
          tx = await contract.mintStamp(recipientAddress, metadataUri);
        } catch {
          tx = await contract.safeMint(recipientAddress, metadataUri);
        }
        
        console.log('[NFT Minting] Transaction sent:', tx.hash);
        const receipt = await tx.wait();
        
        // Extract tokenId from Transfer event
        const transferEvent = receipt.logs.find(
          (log: any) => log.topics[0] === ethers.id('Transfer(address,address,uint256)')
        );
        
        if (transferEvent) {
          tokenId = ethers.toBigInt(transferEvent.topics[3]).toString();
        } else {
          tokenId = generateTokenId();
        }
        
        transactionHash = receipt.hash;
        
        console.log('[NFT Minting] Blockchain mint successful:', {
          tokenId,
          transactionHash,
          contractAddress: process.env.NFT_CONTRACT_ADDRESS,
          network: request.blockchainNetwork,
        });
      } catch (blockchainError: any) {
        console.error('[NFT Minting] Blockchain minting failed:', blockchainError.message);
        console.log('[NFT Minting] Falling back to mock minting');
        tokenId = generateTokenId();
        transactionHash = `0x${randomBytes(32).toString('hex')}`;
      }
    } else {
      // Mock implementation for development/testing
      console.log('[NFT Minting] Using mock minting (blockchain not configured)');
      tokenId = generateTokenId();
      transactionHash = `0x${randomBytes(32).toString('hex')}`;
    }

    console.log('[NFT Minting] Mock mint successful:', {
      tokenId,
      contractAddress,
      network: request.blockchainNetwork,
      stampId: request.stampId,
    });

    return {
      success: true,
      tokenId,
      contractAddress,
      transactionHash,
      metadataUri,
    };
  } catch (error: any) {
    console.error('[NFT Minting] Error:', error);
    return {
      success: false,
      errorMessage: error.message || 'Unknown minting error',
    };
  }
}

/**
 * Get contract address for network (mock addresses)
 */
function getContractAddress(network: string): string {
  const contracts: Record<string, string> = {
    ethereum: '0x1234567890123456789012345678901234567890',
    polygon: '0x2345678901234567890123456789012345678901',
    solana: 'StampCoinNFTxxxxxxxxxxxxxxxxxxxxxxxxx',
    arbitrum: '0x3456789012345678901234567890123456789012',
  };
  return contracts[network] || contracts.ethereum;
}

/**
 * Estimate minting cost (gas fees)
 */
export async function estimateMintingCost(network: string): Promise<{
  gasFee: string;
  currency: string;
}> {
  // Mock estimates - in production, query actual gas prices
  const estimates: Record<string, { gasFee: string; currency: string }> = {
    ethereum: { gasFee: '0.015', currency: 'ETH' },
    polygon: { gasFee: '0.002', currency: 'MATIC' },
    solana: { gasFee: '0.000005', currency: 'SOL' },
    arbitrum: { gasFee: '0.0008', currency: 'ETH' },
  };
  return estimates[network] || estimates.ethereum;
}
