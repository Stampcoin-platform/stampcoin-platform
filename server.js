const express = require("express");
const fs = require("fs").promises;
const fsSync = require("fs");
const path = require("path");
const cors = require("cors");
const multer = require("multer");
const wallet = require("./wallet");
const market = require("./market");
const blockchain = require("./blockchain");

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim())
  : ["http://localhost:8080", "http://localhost:3000", "http://localhost:10000"];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error("Not allowed by CORS"));
  }
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const DATA_FILE = path.join(__dirname, "data.json");
const COMMUNITY_FILE = path.join(__dirname, "community-posts.json");
const NFT_DRAFTS_FILE = path.join(__dirname, "nft-drafts.json");
const P2P_LISTINGS_FILE = path.join(__dirname, "p2p-listings.json");
const UPLOAD_DIR = path.join(__dirname, "public", "uploads");
const SYNC_TOKEN = process.env.SYNC_TOKEN || "";

if (!fsSync.existsSync(UPLOAD_DIR)) {
  fsSync.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const isJpg = file.mimetype === "image/jpeg" || file.mimetype === "image/jpg";
    if (!isJpg) {
      cb(new Error("Only JPG images are allowed"));
      return;
    }
    cb(null, true);
  }
});

// === Authentication Middleware ===
function requireToken(req, res, next) {
  const auth = req.get("Authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!SYNC_TOKEN) {
    if (process.env.NODE_ENV === "production") {
      return res.status(401).json({ error: "Unauthorized" });
    }
    console.warn("SYNC_TOKEN not configured - authentication disabled (development mode)");
    return next();
  }
  if (token !== SYNC_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// === Health & Status Endpoints ===
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "Stampcoin Platform",
    version: "2.0.0"
  });
});

app.get("/api/status", (req, res) => {
  res.json({ success: true, status: "running" });
});

app.get("/api/info", (req, res) => {
  res.json({
    name: "Stampcoin Platform",
    version: "2.0.0",
    description: "Blockchain-powered digital stamps, wallet and marketplace",
    endpoints: {
      wallet: "/api/wallet",
      market: "/api/market",
      blockchain: "/api/blockchain",
      token: "/api/token",
      sync: "/sync"
    }
  });
});

// === Wallet API ===
app.post("/api/wallet/create", (req, res) => {
  try {
    const { userId, userName } = req.body;
    if (!userId || !userName) return res.status(400).json({ error: "userId and userName are required" });
    const w = wallet.createWallet(userId, userName);
    res.json(w);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get("/api/wallet/:userId", (req, res) => {
  try {
    const w = wallet.getWallet(req.params.userId);
    if (!w) return res.status(404).json({ error: "Wallet not found" });
    res.json(w);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/wallet/transfer", (req, res) => {
  try {
    const { fromUserId, toUserId, amount } = req.body;
    if (!fromUserId || !toUserId || !amount) return res.status(400).json({ error: "fromUserId, toUserId, and amount are required" });
    const tx = wallet.transfer(fromUserId, toUserId, Number(amount));
    res.json(tx);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get("/api/wallet/:userId/transactions", (req, res) => {
  try {
    const txs = wallet.getTransactionHistory(req.params.userId);
    res.json(txs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/wallet/:userId/stamps", requireToken, (req, res) => {
  try {
    const stamp = req.body;
    if (!stamp || !stamp.name) return res.status(400).json({ error: "stamp name is required" });
    const w = wallet.addStamp(req.params.userId, stamp);
    res.json(w);
  } catch (e) {
    if (e.message === "Wallet not found") return res.status(404).json({ error: e.message });
    res.status(400).json({ error: e.message });
  }
});

app.get("/api/wallets", requireToken, (req, res) => {
  try {
    res.json(wallet.getAllWallets());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/wallet/:userId/topup", requireToken, (req, res) => {
  try {
    const amount = Number((req.body && req.body.amount) || 1000);
    const w = wallet.updateBalance(req.params.userId, amount);
    res.json(w);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// === Market API ===
app.get("/api/market/items", (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.sellerId) filter.sellerId = req.query.sellerId;
    if (req.query.search) filter.search = req.query.search;

    const minPrice = Number(req.query.minPrice);
    if (!Number.isNaN(minPrice)) filter.minPrice = minPrice;

    const maxPrice = Number(req.query.maxPrice);
    if (!Number.isNaN(maxPrice)) filter.maxPrice = maxPrice;

    if (req.query.sort) filter.sort = req.query.sort;

    const limit = Number(req.query.limit);
    if (Number.isInteger(limit) && limit > 0) filter.limit = limit;

    res.json(market.getAllMarketItems(filter));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/market/items", (req, res) => {
  try {
    const { sellerId, name, description, price, type, imageUrl } = req.body;
    if (!sellerId || !name) return res.status(400).json({ error: "sellerId and name are required" });
    const item = market.addMarketItem(sellerId, { name, description, price, type, imageUrl });
    res.json(item);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get("/api/market/items/:itemId", (req, res) => {
  try {
    res.json(market.getMarketItem(req.params.itemId));
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

app.put("/api/market/items/:itemId", (req, res) => {
  try {
    const { userId, price, description, status, imageUrl } = req.body || {};
    if (!userId) return res.status(400).json({ error: "userId is required" });
    const item = market.getMarketItem(req.params.itemId);
    if (item.sellerId !== userId) return res.status(403).json({ error: "Only the seller can update this item" });
    const updates = {};
    if (price !== undefined) updates.price = price;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (imageUrl !== undefined) updates.imageUrl = imageUrl;
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: "No updatable fields provided" });
    res.json(market.updateMarketItem(req.params.itemId, updates));
  } catch (e) {
    if (e.message === "Market item not found") return res.status(404).json({ error: e.message });
    res.status(400).json({ error: e.message });
  }
});

app.post("/api/market/items/:itemId/buy", (req, res) => {
  try {
    const { buyerId } = req.body;
    if (!buyerId) return res.status(400).json({ error: "buyerId is required" });
    const item = market.getMarketItem(req.params.itemId);
    if (item.price > 0) {
      wallet.transfer(buyerId, item.sellerId, item.price);
    }
    const result = market.purchaseMarketItem(req.params.itemId, buyerId);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.delete("/api/market/items/:itemId", (req, res) => {
  try {
    const userId = (req.body && req.body.userId) || req.query.userId;
    if (!userId) return res.status(400).json({ error: "userId is required" });
    res.json(market.removeMarketItem(req.params.itemId, userId));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get("/api/market/transactions", (req, res) => {
  try {
    const filter = {};
    if (req.query.buyerId) filter.buyerId = req.query.buyerId;
    if (req.query.sellerId) filter.sellerId = req.query.sellerId;
    res.json(market.getMarketTransactions(filter));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// === Token Info API ===
app.get("/api/token", (req, res) => {
  res.json({
    name: "StampCoin",
    symbol: "STP",
    totalSupply: 421000000,
    icoPrice: 1.65,
    icoUnit: "USD",
    decimals: 18,
    license: "MIT",
    website: "https://ecostamp.net",
    github: "https://github.com/zedanazad43/stp",
    contact: "stampcoin.contact@gmail.com",
    distribution: [
      { label: "Public ICO Sale",       percent: 20, amount: 84200000 },
      { label: "Ecosystem & Partners",  percent: 20, amount: 84200000 },
      { label: "Community & Rewards",   percent: 20, amount: 84200000 },
      { label: "Liquidity Pool",        percent: 15, amount: 63150000 },
      { label: "Team & Founders",       percent: 15, amount: 63150000 },
      { label: "Reserve",               percent: 10, amount: 42100000 }
    ],
    contractAddress: process.env.STP_CONTRACT_ADDRESS || "Pending mainnet deployment",
    network: "EVM-compatible"
  });
});

// === Blockchain API ===
app.get("/api/blockchain/info", (req, res) => {
  try {
    res.json(blockchain.getBlockchainInfo());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/blockchain/supply", (req, res) => {
  try {
    res.json(blockchain.getSupply());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/blockchain/mint", requireToken, (req, res) => {
  try {
    const { toAddress, amount } = req.body || {};
    if (!toAddress) return res.status(400).json({ error: "toAddress is required" });
    if (amount === undefined || amount === null) return res.status(400).json({ error: "amount is required" });
    const event = blockchain.mintTokens(toAddress, Number(amount));
    res.json(event);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get("/api/blockchain/balance/:address", (req, res) => {
  try {
    res.json(blockchain.getBalance(req.params.address));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get("/api/blockchain/mint/events", requireToken, (req, res) => {
  try {
    res.json(blockchain.getMintEvents());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// === Sync API (for todo sync) ===
async function readData() {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    console.error("Error reading data file:", e.message);
    return [];
  }
}

async function writeData(todos) {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(todos, null, 2), "utf8");
    return true;
  } catch (e) {
    console.error("Write error:", e);
    return false;
  }
}

async function readJsonArray(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeJsonArray(filePath, rows) {
  await fs.writeFile(filePath, JSON.stringify(rows, null, 2), "utf8");
}

// === Community Hub API ===
app.get("/api/community/posts", async (_req, res) => {
  try {
    const posts = await readJsonArray(COMMUNITY_FILE);
    res.json(posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/community/posts", async (req, res) => {
  try {
    const { title, body, imageUrl, authorId } = req.body || {};
    if (!title || !body) {
      return res.status(400).json({ error: "title and body are required" });
    }
    const posts = await readJsonArray(COMMUNITY_FILE);
    const post = {
      id: `post_${Date.now()}`,
      title,
      body,
      imageUrl: imageUrl || "",
      authorId: authorId || "anonymous",
      createdAt: new Date().toISOString()
    };
    posts.push(post);
    await writeJsonArray(COMMUNITY_FILE, posts);
    res.json(post);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// === NFT Categories + Mint Draft API ===
app.get("/api/nft/categories", (_req, res) => {
  res.json([
    { id: "PH-001", name: "Penny Black Heritage", floorPriceUsd: 220 },
    { id: "BM-019", name: "Blue Mauritius Legacy", floorPriceUsd: 680 },
    { id: "IJ-024", name: "Inverted Jenny Classics", floorPriceUsd: 390 },
    { id: "MAP-311", name: "Modern Arab Philately", floorPriceUsd: 170 }
  ]);
});

app.get("/api/nft/mint-drafts", async (_req, res) => {
  try {
    const drafts = await readJsonArray(NFT_DRAFTS_FILE);
    res.json(drafts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/nft/mint-drafts", upload.single("stampImage"), async (req, res) => {
  try {
    const { ownerId, stampTitle, feeCurrency, feeAmount } = req.body || {};
    if (!ownerId || !stampTitle || !feeCurrency || feeAmount === undefined) {
      return res.status(400).json({ error: "ownerId, stampTitle, feeCurrency, and feeAmount are required" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "JPG image is required" });
    }

    const amount = Number(feeAmount);
    const userShare = Number((amount * 0.85).toFixed(6));
    const platformShare = Number((amount * 0.15).toFixed(6));
    const publicImagePath = `/uploads/${req.file.filename}`;

    const drafts = await readJsonArray(NFT_DRAFTS_FILE);
    const draft = {
      id: `draft_${Date.now()}`,
      ownerId,
      stampTitle,
      feeCurrency,
      feeAmount: amount,
      split: {
        user: userShare,
        platform: platformShare,
        userPercent: 85,
        platformPercent: 15
      },
      imagePath: publicImagePath,
      fileName: req.file.originalname,
      web3Status: "ready_for_mint",
      createdAt: new Date().toISOString()
    };
    drafts.push(draft);
    await writeJsonArray(NFT_DRAFTS_FILE, drafts);
    res.json(draft);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// === P2P Listings API ===
app.get("/api/p2p/listings", async (_req, res) => {
  try {
    const listings = await readJsonArray(P2P_LISTINGS_FILE);
    res.json(listings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/p2p/listings", async (req, res) => {
  try {
    const { sellerId, stampDetails, askPriceUsd } = req.body || {};
    if (!sellerId || !stampDetails || !askPriceUsd) {
      return res.status(400).json({ error: "sellerId, stampDetails, and askPriceUsd are required" });
    }
    const price = Number(askPriceUsd);
    const platformFeeUsd = Number((price * 0.035).toFixed(2));
    const sellerNetUsd = Number((price - platformFeeUsd).toFixed(2));

    const listings = await readJsonArray(P2P_LISTINGS_FILE);
    const row = {
      id: `p2p_${Date.now()}`,
      sellerId,
      stampDetails,
      askPriceUsd: price,
      platformFeeUsd,
      sellerNetUsd,
      escrowStatus: "open",
      createdAt: new Date().toISOString()
    };
    listings.push(row);
    await writeJsonArray(P2P_LISTINGS_FILE, listings);
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// === Web3 API ===
app.get("/api/web3/config", (_req, res) => {
  res.json({
    chainId: process.env.WEB3_CHAIN_ID || "0xaa36a7",
    networkName: process.env.WEB3_NETWORK || "sepolia",
    rpcUrl: process.env.WEB3_RPC_URL || "https://rpc.sepolia.org",
    stcContractAddress: process.env.STP_CONTRACT_ADDRESS || "0x8A63eA3D5D8D0F7A9C09F9e6f8c5B18F4c4d1A21",
    nftContractAddress: process.env.STC_NFT_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000",
    explorerBase: process.env.WEB3_EXPLORER || "https://sepolia.etherscan.io"
  });
});

app.post("/api/web3/quote", (req, res) => {
  const amount = Number((req.body && req.body.amount) || 0);
  const feeRate = 0.015;
  const estimatedFee = Number((amount * feeRate).toFixed(6));
  res.json({
    amount,
    feeRate,
    estimatedFee,
    totalWithFee: Number((amount + estimatedFee).toFixed(6))
  });
});

app.get("/sync", requireToken, async (req, res) => {
  const todos = await readData();
  res.json({ todos });
});

app.post("/sync", requireToken, async (req, res) => {
  const payload = req.body;
  if (!payload || !Array.isArray(payload.todos)) {
    return res.status(400).json({ error: "Invalid payload, expected { todos: [...] }" });
  }
  const ok = await writeData(payload.todos);
  if (!ok) return res.status(500).json({ error: "Failed to store data" });
  res.json({ ok: true });
});

// === SPA Fallback ===
app.get("*", (req, res) => {
  const indexPath = path.join(__dirname, "public", "index.html");
  res.sendFile(indexPath);
});

// === Start Server ===
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log(`✓ Stampcoin Platform server running on port ${port}`);
  console.log(`✓ API docs available at: http://localhost:${port}/api/info`);
  console.log(`✓ Health check: http://localhost:${port}/health`);
});
