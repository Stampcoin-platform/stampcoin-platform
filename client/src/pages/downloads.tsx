/**
 * NFT Downloads Page
 * Full page for browsing and downloading minted stamp NFTs
 */

import { NFTDownloadsGallery } from '../components/NFTDownloadsGallery';

export function DownloadsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <NFTDownloadsGallery />
    </div>
  );
}

export default DownloadsPage;
