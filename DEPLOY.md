# Kasoli-ku-Mukutu Deployment Guide

## Overview
This document chronicles the deployment journey of the Kasoli-ku-Mukutu grain trading platform to Vercel, including all the challenges encountered and their solutions.

## Project Stack
- **Frontend**: Next.js 15.3.4 with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Blockchain**: Ethereum integration with Wagmi/RainbowKit
- **Deployment**: Vercel
- **Authentication**: Web3 wallet-based authentication

## Pre-Deployment Setup

### 1. Database Configuration
- Set up PostgreSQL database (we used a cloud provider)
- Configure Prisma schema with all required models
- Set up database migrations and seeding

### 2. Environment Variables
Ensure all required environment variables are configured in Vercel:
```env
DATABASE_URL=postgresql://...
NEXT_PUBLIC_PLATFORM_ADDRESS=0x...
# Add other required environment variables
```

## Deployment Challenges & Solutions

### Challenge 1: React Warning - Unrecognized `errorCorrection` Prop
**Problem**: React warning about unrecognized `errorCorrection` prop from RainbowKit
**Solution**: Updated RainbowKit to the latest version
```bash
npm update @rainbow-me/rainbowkit
```

### Challenge 2: TypeScript Errors in Route Handlers
**Problem**: TypeScript errors in API route handlers due to Next.js 15 changes
**Solution**: Updated route handler parameter types to use Promise for dynamic routes
```typescript
// Before (Next.js 14)
export async function POST(req: NextRequest, { params }: { params: { dealId: string } })

// After (Next.js 15)
export async function POST(req: NextRequest, { params }: { params: Promise<{ dealId: string }> })
```

### Challenge 3: Missing Dependencies
**Problem**: Build failed due to missing `pino-pretty` package
**Solution**: Installed the missing dependency
```bash
npm install pino-pretty
```

### Challenge 4: Static Generation of API Routes
**Problem**: Next.js was trying to statically generate API routes during build, causing failures
**Error**: `Failed to collect page data for /api/batch`

**Solution**: Added dynamic exports to all API routes
```typescript
// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
```

**Files Modified**:
- `src/app/api/batch/route.ts`
- `src/app/api/deal/route.ts`
- `src/app/api/deal/[dealId]/accept/route.ts`
- `src/app/api/deal/[dealId]/escrow/route.ts`
- `src/app/api/deal/[dealId]/farmer-sign/route.ts`
- `src/app/api/deal/[dealId]/finalize/route.ts`
- `src/app/api/deal/[dealId]/transporter-sign/route.ts`
- `src/app/api/deal/accept/route.ts`
- `src/app/api/user/connect/route.ts`
- `src/app/api/user/role/route.ts`
- `src/app/api/test-db/route.ts`
- `src/app/api/distance/route.ts`
- `src/app/api/places/route.ts`
- `src/app/api/signature-timeout/route.ts`
- `src/app/api/test-distance/route.ts`
- `src/app/api/ipfs/file/route.ts`
- `src/app/api/ipfs/json/route.ts`

### Challenge 5: Next.js Configuration Issues
**Problem**: Deprecated configuration options causing warnings
**Solution**: Updated `next.config.ts` to use current syntax
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client'],
  output: 'standalone',
};

export default nextConfig;
```

### Challenge 6: Prisma Client Initialization Error
**Problem**: Vercel caches dependencies, preventing Prisma Client regeneration
**Error**: `PrismaClientInitializationError: Prisma has detected that this project was built on Vercel`

**Solution**: Added postinstall script to `package.json`
```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

## Final Build Configuration

### package.json Scripts
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "vercel-build": "prisma generate && prisma db push && next build",
    "db:push": "prisma db push",
    "db:seed": "prisma db seed",
    "prisma:generate": "prisma generate",
    "postinstall": "prisma generate"
  }
}
```

### API Route Structure
All API routes now include:
```typescript
// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
```

## Deployment Checklist

### Before Deployment
- [ ] All environment variables configured in Vercel
- [ ] Database migrations applied
- [ ] Prisma schema up to date
- [ ] All API routes have dynamic exports
- [ ] TypeScript compilation successful
- [ ] Local build successful

### During Deployment
- [ ] Monitor build logs for any errors
- [ ] Verify Prisma Client generation
- [ ] Check API route compilation
- [ ] Ensure static pages generate correctly

### After Deployment
- [ ] Test all API endpoints
- [ ] Verify database connectivity
- [ ] Test user authentication flows
- [ ] Check blockchain integration
- [ ] Validate all user roles and permissions

## Key Learnings

### 1. Next.js 15 Changes
- API route parameters are now Promises
- More strict static generation rules
- Updated configuration syntax

### 2. Vercel-Specific Considerations
- Dependencies are cached, requiring explicit regeneration
- API routes must be explicitly marked as dynamic
- Environment variables must be configured in Vercel dashboard

### 3. Prisma Best Practices
- Always include `postinstall` script for Vercel
- Use `serverExternalPackages` in Next.js config
- Ensure database migrations are applied

### 4. TypeScript Configuration
- Keep TypeScript strict mode enabled
- Update types for new framework versions
- Use proper typing for dynamic routes

## Troubleshooting Guide

### Common Build Errors

1. **"Failed to collect page data for /api/..."**
   - Add `export const dynamic = 'force-dynamic';` to the API route

2. **"Parameter 'deal' implicitly has an 'any' type"**
   - Add explicit typing: `(deal: any) => ...`

3. **"PrismaClientInitializationError"**
   - Ensure `postinstall` script is in package.json
   - Check DATABASE_URL environment variable

4. **"Unrecognized key(s) in object"**
   - Update Next.js configuration to use current syntax
   - Remove deprecated experimental options

### Performance Optimizations
- API routes are now properly marked as dynamic (ƒ symbol in build output)
- Static pages are pre-rendered for optimal performance
- Database connections are properly managed

## Final Status
✅ **Deployment Successful**
- All API routes working correctly
- Database connectivity established
- User authentication functional
- Blockchain integration operational
- All user roles and permissions working

## Future Considerations
- Monitor database performance
- Set up proper logging and monitoring
- Consider implementing caching strategies
- Plan for database scaling
- Regular dependency updates and security patches

---

*This deployment was completed after resolving multiple framework compatibility issues and Vercel-specific configuration challenges. The platform is now fully operational with all features working as expected.* 