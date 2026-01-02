# StampCoin Platform 🪙

A revolutionary blockchain-powered NFT marketplace for digital asset ownership and trading.

## 🚀 Live Demo

- **Production:** https://stampcoin-platform.fly.dev
- **Repository:** https://github.com/AzadZedan/Stampcoin-platform

## 📋 Features

- **NFT Minting & Trading** - Create and trade unique digital assets
- **Stripe Integration** - Seamless fiat currency payments
- **User Authentication** - Secure session-based auth
- **Responsive Design** - Works on all devices
- **Real-time Updates** - Live marketplace data
- **AWS S3 Storage** - Reliable asset storage

## 🛠️ Tech Stack

### Frontend
- React 19 + TypeScript
- Vite
- TailwindCSS 4
- tRPC Client
- Wouter (routing)

### Backend
- Node.js 22
- Express
- tRPC
- Drizzle ORM
- MySQL (TiDB Cloud)

### Infrastructure
- **Hosting:** Fly.io
- **Database:** TiDB Cloud
- **Storage:** AWS S3
- **Payments:** Stripe
- **CI/CD:** GitHub Actions

## 📦 Installation

### Prerequisites
- Node.js 22+
- pnpm 10+
- MySQL database

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/AzadZedan/Stampcoin-platform.git
   cd Stampcoin-platform
   ```

2. **Install dependencies**
   ```bash
  npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Database
   DATABASE_URL=mysql://user:password@host:port/database
   
   # Stripe
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   
   # AWS S3
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=your-bucket-name
   
   # Session
   JWT_SECRET=your-random-secret-key
   

   
   # Node
   NODE_ENV=development
   PORT=3000
   ```

4. **Push database schema**
   ```bash
   npm run db:push
   ```

5. **Run development server**
   ```bash
  npm run dev
   ```

   The app will be available at http://localhost:3000

## 🏗️ Build & Deploy

### Build for production
```bash
# Build frontend
npm run build:frontend

# Build backend
npm run build

# Start production server
npm start
```

### Deploy to Fly.io

1. **Install Fly CLI**
   ```bash
   # Windows (PowerShell)
   iwr https://fly.io/install.ps1 -useb | iex
   
   # macOS/Linux
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login to Fly.io**
   ```bash
   fly auth login
   ```

3. **Deploy**
   ```bash
   fly deploy -a stampcoin-platform
   ```

4. **Set environment variables**
   ```bash
   fly secrets set DATABASE_URL="mysql://..." -a stampcoin-platform
   fly secrets set STRIPE_SECRET_KEY="sk_..." -a stampcoin-platform
   fly secrets set JWT_SECRET="your-secret" -a stampcoin-platform
   # ... add all other secrets
   ```

## 📁 Project Structure

```
stampcoin-platform/
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities and helpers
│   │   └── main.tsx       # Entry point
│   └── index.html
├── server/                # Backend Express app
│   ├── _core/            # Core server functionality
│   │   ├── index.ts      # Server entry point
│   │   ├── oauth.ts      # OAuth authentication
│   │   ├── trpc.ts       # tRPC setup
│   │   └── vite.ts       # Vite integration
│   ├── db.ts             # Database operations
│   ├── routers.ts        # API routes
│   ├── storage.ts        # S3 storage
│   └── stripe-webhook.ts # Stripe webhooks
├── drizzle/              # Database schema & migrations
├── shared/               # Shared types & constants
├── .github/workflows/    # CI/CD workflows
├── Dockerfile            # Docker configuration
├── fly.toml              # Fly.io configuration
└── package.json          # Dependencies
```

## 🧪 Testing

```bash
# Run tests
npm test

# Type checking
npm run check

# Format code
npm run format
```

## 🔧 Scripts

- `npm dev` - Start development server
- `npm build` - Build backend
- `npm build:frontend` - Build frontend
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run check` - Type check
- `npm run format` - Format code
- `npm run db:push` - Push database schema

## 🐛 Troubleshooting

### OAuth Errors
If you see "OAUTH_SERVER_URL is not configured", this is normal if you're not using OAuth authentication. The app will work without it.

### Database Connection Issues
Make sure your DATABASE_URL is correct and the database is accessible from your deployment environment.

### Stripe Webhook Issues
For local development, use Stripe CLI to forward webhooks:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### Build Errors
Clear cache and rebuild:
```bash
rm -rf node_modules dist client/dist
npm install
npm run build:frontend
npm run build
```

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

- **Email:** partnerships@stampcoin.io
- **Website:** https://stampcoin-platform.fly.dev
- **GitHub:** https://github.com/AzadZedan/Stampcoin-platform

## 🙏 Acknowledgments

Built with modern web technologies and deployed on Fly.io infrastructure.

---

**Made with ❤️ by the StampCoin Team**
