# 🚀 Setup & Deployment Guide

## Prerequisites

- Node.js 16+ 
- PostgreSQL database
- Discord OAuth credentials
- Environment variables configured

## Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Create `.env.local` file:
```
DATABASE_URL="postgresql://user:password@localhost:5432/mahjong"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
DISCORD_CLIENT_ID="your-discord-id"
DISCORD_CLIENT_SECRET="your-discord-secret"
API_SECRET="your-api-secret-for-discord-bot"
NEXT_PUBLIC_ADMIN_DISCORD_IDS="123456789,987654321"  # Comma-separated
```

### 3. Database Setup
```bash
# Generate Prisma Client
npx prisma generate

# Run migrations (create/update tables)
npx prisma migrate deploy

# (Optional) Reset database during development
npx prisma db push
```

## Running Locally

```bash
npm run dev
```

Access at: http://localhost:3000

## Admin Features Usage

### Access Admin Panel
1. Login with Discord
2. Go to `/admin` (only works if your Discord ID is in `NEXT_PUBLIC_ADMIN_DISCORD_IDS`)

### Admin Panel Features

#### 💰 Topup Coin
- Search user by Discord ID or User ID
- Enter amount to topup
- Click "Topup" button
- See confirmation with old/new balance

#### 🎯 Set Win Rate
- Search user first
- Enter max big win count (0 = never get big win)
- Click "Set" button
- Win counter resets automatically

#### 🃏 Set Custom Card
- Search user first
- Click "Set Kartu Kosong (No Symbols)" button
- Cards will display empty (no symbols)

### API Endpoints

#### POST /api/admin/topup
```json
{
  "userId": "discord-id-or-user-id",
  "amount": 1000
}
```

#### POST /api/admin/win-rate
```json
{
  "userId": "discord-id-or-user-id",
  "maxBigWin": 3
}
```

#### POST /api/admin/custom-card
```json
{
  "userId": "discord-id-or-user-id",
  "cardType": "empty"
}
```

#### GET /api/admin/user-info
```
/api/admin/user-info?userId=discord-id-or-user-id
```

## Testing

### Manual Testing

1. **Create Test User:**
   - Login to web app
   - System auto-creates user from Discord

2. **Test Topup:**
   - Go to Admin panel
   - Search your test user
   - Topup 1000 coins
   - Verify balance increased

3. **Test Win Rate:**
   - Set maxBigWin to 2
   - Verify in user info
   - Set to 1
   - Verify counter resets

4. **Test Custom Card:**
   - Set custom card
   - Verify in user info
   - Card customization field shows: `{type: "empty", isEmpty: true}`

## Deployment

### Deploy to Production

#### Option 1: Vercel (Recommended)
```bash
npx vercel
```

#### Option 2: Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

#### Option 3: Traditional Server (Ubuntu/Debian)
```bash
# Install Node
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Setup app
git clone your-repo
cd your-repo
npm install
npx prisma migrate deploy
npm run build

# Use PM2 or systemd to run
npm install -g pm2
pm2 start npm --name "mahjong" -- start
```

### Database for Production
- Use managed PostgreSQL (AWS RDS, Railway, Render, etc.)
- Set `DATABASE_URL` environment variable
- Run migrations: `npx prisma migrate deploy`

## Troubleshooting

### Issue: "User not found"
- Check Discord ID format is correct
- Verify user has logged in at least once
- Check in database: `SELECT * FROM "User" WHERE "discordId" = 'xxx';`

### Issue: "Unauthorized" on admin endpoints
- Verify your Discord ID in `.env.local`
- Check `NEXT_PUBLIC_ADMIN_DISCORD_IDS` is set correctly
- Clear browser cookies and re-login

### Issue: Database connection error
- Check `DATABASE_URL` is correct
- Verify PostgreSQL is running
- Check database exists: `psql -l`

### Issue: Prisma client not found
```bash
npx prisma generate
npm install
```

## Monitoring

### Check Admin Actions
```sql
SELECT * FROM "AdminCoinAction" 
ORDER BY "createdAt" DESC 
LIMIT 20;
```

### Check User Settings
```sql
SELECT u."username", s."maxBigWin", s."currentWin", s."cardCustomization"
FROM "User" u
LEFT JOIN "UserSetting" s ON u."id" = s."userId"
LIMIT 20;
```

### Check Balances
```sql
SELECT "username", "balance", "createdAt"
FROM "User"
ORDER BY "createdAt" DESC;
```

## Performance Tips

1. **Rate Limiting:** Already implemented in `/api/mahjong/play`
2. **Caching:** Game config cached for 15 seconds
3. **Database:** Add indexes if experiencing slow queries
4. **Sessions:** NextAuth manages sessions efficiently

## Security

- ✅ API key protection for Discord bot
- ✅ Admin Discord ID whitelist
- ✅ SQL injection protection (Prisma)
- ✅ CSRF protection (NextAuth)
- ✅ Race condition prevention in play endpoint
- ✅ Atomic transactions for critical operations

## Support

For issues, check:
1. Browser console for errors
2. Server logs: `npm run dev` output
3. Database: Verify data with SQL queries
4. Prisma Studio: `npx prisma studio`

---

**Happy deploying! 🎉**
