# API Keys Configuration Guide

## File Location
`C:\Users\abina\astrocric\backend\.env`

## API Keys You Need to Add

### 1. Cricket API Key
```
CRICKET_API_KEY=your_cricket_api_key
```
**Where to get**: https://www.cricapi.com/
- Sign up for free account
- Get API key from dashboard
- Paste it in the .env file

### 2. MSG91 Auth Key
```
MSG91_AUTH_KEY=your_msg91_auth_key
```
**You mentioned you already have MSG91** - just paste your auth key here!

### 3. Database URL (for local development)
```
DATABASE_URL=postgresql://user:password@localhost:5432/astrocric
```
Replace with your local PostgreSQL credentials.

## Already Configured (No Changes Needed)

✅ **PhonePe Business** - Using UAT/Test credentials
- PHONEPE_MERCHANT_ID=PGTESTPAYUAT
- PHONEPE_SALT_KEY=099eb0cd-02cf-4e2a-8aca-3e6c6aff0399

✅ **JWT Secrets** - Default development keys (change in production)

✅ **Server Port** - 3000

## How to Edit .env File

1. Open file: `C:\Users\abina\astrocric\backend\.env`
2. Find the lines with `your_cricket_api_key` and `your_msg91_auth_key`
3. Replace with your actual API keys
4. Save the file

## After Adding Keys

Run the backend server:
```bash
cd C:\Users\abina\astrocric\backend
npm run dev
```

Server will start on http://localhost:3000

---

**Ready!** Just paste your API keys and you're good to go! 🚀
