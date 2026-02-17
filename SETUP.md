# Astrocric - Quick Setup Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed
- Flutter SDK installed (for mobile app)
- Git installed

## Setup Steps

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials

# Create database
createdb astrocric
psql astrocric < database/schema.sql

# Start server
npm run dev
```

Backend runs on http://localhost:3000

### 2. Mobile App Setup

```bash
cd mobile
flutter pub get
# Edit lib/config/constants.dart with API URL
flutter run
```

### 3. Admin Panel Setup

```bash
cd admin-panel
npm install
npm run dev
```

Admin panel runs on http://localhost:5173

## Next Steps

1. **Get API Keys**
   - Cricket API: https://www.cricapi.com/
   - PhonePe Business: https://business.phonepe.com/
   - MSG91: https://msg91.com/

2. **Update Environment Variables**
   - Add API keys to `backend/.env`
   - Update `mobile/lib/config/constants.dart`

3. **Test the Application**
   - Send OTP via `/api/auth/send-otp`
   - Verify OTP and get JWT token
   - Test match endpoints

## Deployment

### Railway (Backend)
1. Push to GitHub
2. Connect to Railway
3. Add PostgreSQL database
4. Set environment variables
5. Deploy

### PlayStore (Mobile)
```bash
cd mobile
flutter build apk --release
```

### Vercel (Admin Panel)
```bash
cd admin-panel
npm run build
vercel deploy
```

## Support

See individual README files in each directory for detailed documentation.
