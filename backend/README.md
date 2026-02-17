# Astrocric Backend

Node.js + Express backend API for Astrocric cricket prediction platform.

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Set up database**
   ```bash
   # Create PostgreSQL database
   createdb astrocric
   
   # Run schema
   psql astrocric < database/schema.sql
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

Server runs on http://localhost:3000

## API Endpoints

- `POST /api/auth/send-otp` - Send OTP to phone
- `POST /api/auth/verify-otp` - Verify OTP and login
- `GET /api/matches/upcoming` - Get upcoming matches
- `GET /api/matches/live` - Get live matches
- `GET /api/matches/finished` - Get finished matches
- `POST /api/payment/create-order` - Create payment order
- `POST /api/payment/verify` - Verify payment

## Deployment to Railway

1. Push code to GitHub
2. Connect repository to Railway
3. Add PostgreSQL database
4. Set environment variables
5. Deploy automatically

## Environment Variables

See `.env.example` for required variables.
