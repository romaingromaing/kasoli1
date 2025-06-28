# Kasoli-ku-Mukutu

Secure grain trading platform with blockchain escrow, digital receipts, and real-time tracking.

## Features

- 🌾 **Digital Receipts**: Blockchain-verified grain certificates with IPFS metadata
- 🔐 **Secure Escrow**: Multi-signature smart contracts protect all parties
- 🚛 **Live Tracking**: Real-time delivery updates with QR code verification
- 👥 **Multi-Party**: Farmers, buyers, transporters, and platform coordination

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Blockchain**: Wagmi v2, Viem, RainbowKit
- **Database**: PostgreSQL with Prisma ORM
- **Storage**: IPFS for metadata and images
- **Smart Contracts**: Solidity (Escrow, Receipt, Oracle)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- PostgreSQL database
- Vercel CLI (for deployment)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd kasoli1
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your `.env.local`:
```env
# Database
DATABASE_URL="postgresql://..."

# Blockchain
NEXT_PUBLIC_RPC_URL="https://sepolia.base.org"
NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS="0x..."
NEXT_PUBLIC_RECEIPT_CONTRACT_ADDRESS="0x..."
NEXT_PUBLIC_ORACLE_CONTRACT_ADDRESS="0x..."
NEXT_PUBLIC_USDC_CONTRACT_ADDRESS="0x..."

# Platform
NEXT_PUBLIC_PLATFORM_ADDRESS="0x..."

# IPFS (optional)
NEXT_PUBLIC_IPFS_GATEWAY="https://ipfs.io/ipfs/"

# Google Maps (optional)
GOOGLE_MAPS_API_KEY="..."
```

5. Set up the database:
```bash
npx prisma db push
npx prisma db seed
```

6. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Deployment

### Vercel Deployment

1. **Install Vercel CLI**:
```bash
npm i -g vercel
```

2. **Login to Vercel**:
```bash
vercel login
```

3. **Deploy to Vercel**:
```bash
vercel --prod
```

4. **Set Environment Variables** in Vercel Dashboard:
   - Go to your project settings
   - Add all environment variables from your `.env.local`
   - Ensure `DATABASE_URL` points to your production database

5. **Database Setup**:
   - Use a production PostgreSQL database (e.g., Supabase, Neon, Railway)
   - Run migrations: `npx prisma db push`
   - Seed the database: `npx prisma db seed`

### Manual Deployment

1. **Build the application**:
```bash
npm run build
```

2. **Start production server**:
```bash
npm start
```

## Database Schema

The application uses the following main models:

- **User**: Core user management with role-based access
- **Farmer**: Grain producers with batch management
- **Buyer**: Grain purchasers with order tracking
- **Transporter**: Delivery providers with route management
- **Batch**: Grain batches with digital receipts
- **Deal**: Escrow transactions with multi-signature workflow

## Smart Contracts

- **EscrowSafe**: Multi-signature escrow for secure payments
- **WarehouseReceipt**: Digital grain certificates on blockchain
- **FreightOracle**: Dynamic freight pricing based on fuel costs

## Role-Based Access

| Role | Pages | Actions |
|------|-------|---------|
| **Farmer** | Dashboard, Batches, Profile | Create batches, sign deliveries |
| **Buyer** | Market, Orders, Profile | Purchase grain, fund escrow |
| **Transporter** | Dashboard, Deliveries, Profile | Accept deliveries, sign pickups |
| **Platform** | Dashboard, Settings | Manage platform, update prices |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

### Role-Based Access
- **Farmers**: List batches, track receipts
- **Transporters**: Scan QR codes, manage deliveries
- **Buyers**: Browse market, commit payments
- **Platform**: Finalize deals, resolve disputes, update diesel prices

### Smart Contract Integration
- **EscrowSafe v3**: Secure payment handling
- **WarehouseReceipt**: Digital commodity certificates
- **Multi-signature**: Role-based transaction signing

### PWA Features
- Offline-first architecture
- Add to Home Screen (A2HS)
- Service worker caching
- Push notifications (planned)

## Testing

The application includes comprehensive testing:

- **Unit Tests**: Component and utility function testing
- **Integration Tests**: User workflow testing
- **E2E Tests**: Complete user journey testing
- **Smart Contract Tests**: Blockchain interaction testing
