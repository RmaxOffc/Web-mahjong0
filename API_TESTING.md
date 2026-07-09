# 🧪 API Testing Guide

## Prerequisites
- Admin session cookie (login first at web UI)
- User ID (can use Discord ID or database ID)
- `curl` installed (or Postman)

## Testing Admin Endpoints

### 1. ✅ Get User Info

**Endpoint:** `GET /api/admin/user-info`

#### Using cURL (Web Browser Session)
```bash
# With browser session (after login)
curl -X GET \
  'http://localhost:3000/api/admin/user-info?userId=123456789' \
  -H 'Cookie: next-auth.session-token=YOUR_SESSION_TOKEN'
```

#### Using cURL (from script)
```bash
curl -X GET \
  'http://localhost:3000/api/admin/user-info?userId=john_doe_id'
```

#### Expected Response ✅
```json
{
  "success": true,
  "user": {
    "id": "user-uuid-xxx",
    "discordId": "123456789",
    "username": "john_doe",
    "balance": "5000",
    "createdAt": "2026-07-01T10:00:00.000Z",
    "settings": {
      "id": "setting-uuid",
      "userId": "user-uuid-xxx",
      "maxBigWin": 1,
      "currentWin": 0,
      "cardCustomization": null,
      "createdAt": "2026-07-01T10:00:00.000Z",
      "updatedAt": "2026-07-01T10:00:00.000Z"
    },
    "recentActions": [
      {
        "id": "action-uuid",
        "adminId": "admin-uuid",
        "admin": {
          "username": "admin_user",
          "discordId": "999999999"
        },
        "targetUserId": "user-uuid-xxx",
        "actionType": "TOPUP",
        "amount": "1000",
        "oldValue": {"balance": "4000"},
        "newValue": {"balance": "5000"},
        "createdAt": "2026-07-02T15:30:00.000Z"
      }
    ]
  }
}
```

---

### 2. 💰 Topup Coin

**Endpoint:** `POST /api/admin/topup`

#### Using cURL
```bash
curl -X POST \
  'http://localhost:3000/api/admin/topup' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: next-auth.session-token=YOUR_SESSION_TOKEN' \
  -d '{
    "userId": "john_doe_id",
    "amount": 1000
  }'
```

#### Using Postman
1. Method: `POST`
2. URL: `http://localhost:3000/api/admin/topup`
3. Headers:
   - `Content-Type`: `application/json`
4. Body (JSON):
   ```json
   {
     "userId": "john_doe_id",
     "amount": 1000
   }
   ```
5. Send

#### Expected Response ✅
```json
{
  "success": true,
  "message": "✅ Berhasil topup 1000 coin untuk user john_doe",
  "data": {
    "userId": "user-uuid-xxx",
    "username": "john_doe",
    "oldBalance": "4000",
    "newBalance": "5000"
  }
}
```

#### Error Cases ❌

**Missing amount:**
```json
{
  "error": "Invalid data"
}
```

**User not found:**
```json
{
  "error": "User not found"
}
```

**Unauthorized (not admin):**
```json
{
  "error": "Unauthorized"
}
```

---

### 3. 🎯 Set Win Rate

**Endpoint:** `POST /api/admin/win-rate`

#### Using cURL
```bash
curl -X POST \
  'http://localhost:3000/api/admin/win-rate' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: next-auth.session-token=YOUR_SESSION_TOKEN' \
  -d '{
    "userId": "john_doe_id",
    "maxBigWin": 3
  }'
```

#### Using JavaScript/Fetch
```javascript
const response = await fetch('/api/admin/win-rate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'john_doe_id',
    maxBigWin: 3
  })
});
const data = await response.json();
console.log(data);
```

#### Expected Response ✅
```json
{
  "success": true,
  "message": "✅ Set win rate untuk john_doe: 3x big win (counter direset)",
  "data": {
    "userId": "user-uuid-xxx",
    "username": "john_doe",
    "maxBigWin": 3,
    "currentWin": 0
  }
}
```

#### Testing Different Win Rates

```bash
# User dapat 1x big win
curl -X POST 'http://localhost:3000/api/admin/win-rate' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: next-auth.session-token=YOUR_TOKEN' \
  -d '{"userId": "john_doe_id", "maxBigWin": 1}'

# User dapat 5x big win
curl -X POST 'http://localhost:3000/api/admin/win-rate' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: next-auth.session-token=YOUR_TOKEN' \
  -d '{"userId": "john_doe_id", "maxBigWin": 5}'

# User tidak pernah dapat big win
curl -X POST 'http://localhost:3000/api/admin/win-rate' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: next-auth.session-token=YOUR_TOKEN' \
  -d '{"userId": "john_doe_id", "maxBigWin": 0}'
```

---

### 4. 🃏 Set Custom Card

**Endpoint:** `POST /api/admin/custom-card`

#### Using cURL
```bash
curl -X POST \
  'http://localhost:3000/api/admin/custom-card' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: next-auth.session-token=YOUR_SESSION_TOKEN' \
  -d '{
    "userId": "john_doe_id",
    "cardType": "empty"
  }'
```

#### Using JavaScript
```javascript
async function setEmptyCard(userId) {
  const response = await fetch('/api/admin/custom-card', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: userId,
      cardType: 'empty'
    })
  });
  
  const data = await response.json();
  if (response.ok) {
    console.log('✅', data.message);
    console.log('Data:', data.data);
  } else {
    console.error('❌', data.error);
  }
}

// Usage
setEmptyCard('john_doe_id');
```

#### Expected Response ✅
```json
{
  "success": true,
  "message": "✅ Set custom card untuk john_doe - Kartu Kosong (no symbols)",
  "data": {
    "userId": "user-uuid-xxx",
    "username": "john_doe",
    "cardType": "empty",
    "customization": {
      "type": "empty",
      "isEmpty": true,
      "timestamp": "2026-07-02T15:35:00.000Z"
    }
  }
}
```

---

## Full Integration Test Script

### Bash Script (test.sh)
```bash
#!/bin/bash

# Configuration
BASE_URL="http://localhost:3000"
ADMIN_TOKEN="your_admin_session_token"
TEST_USER_ID="test_user_123"

echo "🧪 Running Mahjong Admin API Tests..."
echo ""

# Test 1: Get User Info
echo "1️⃣ Testing GET /api/admin/user-info..."
curl -s -X GET \
  "$BASE_URL/api/admin/user-info?userId=$TEST_USER_ID" \
  -H "Cookie: next-auth.session-token=$ADMIN_TOKEN" | jq .
echo ""

# Test 2: Topup
echo "2️⃣ Testing POST /api/admin/topup..."
curl -s -X POST \
  "$BASE_URL/api/admin/topup" \
  -H 'Content-Type: application/json' \
  -H "Cookie: next-auth.session-token=$ADMIN_TOKEN" \
  -d "{\"userId\": \"$TEST_USER_ID\", \"amount\": 1000}" | jq .
echo ""

# Test 3: Set Win Rate
echo "3️⃣ Testing POST /api/admin/win-rate..."
curl -s -X POST \
  "$BASE_URL/api/admin/win-rate" \
  -H 'Content-Type: application/json' \
  -H "Cookie: next-auth.session-token=$ADMIN_TOKEN" \
  -d "{\"userId\": \"$TEST_USER_ID\", \"maxBigWin\": 3}" | jq .
echo ""

# Test 4: Set Custom Card
echo "4️⃣ Testing POST /api/admin/custom-card..."
curl -s -X POST \
  "$BASE_URL/api/admin/custom-card" \
  -H 'Content-Type: application/json' \
  -H "Cookie: next-auth.session-token=$ADMIN_TOKEN" \
  -d "{\"userId\": \"$TEST_USER_ID\", \"cardType\": \"empty\"}" | jq .
echo ""

# Test 5: Verify Changes
echo "5️⃣ Verifying changes..."
curl -s -X GET \
  "$BASE_URL/api/admin/user-info?userId=$TEST_USER_ID" \
  -H "Cookie: next-auth.session-token=$ADMIN_TOKEN" | jq .

echo ""
echo "✅ All tests completed!"
```

**Run:**
```bash
chmod +x test.sh
./test.sh
```

---

## Database Query Testing

### Check Admin Actions Log
```sql
SELECT 
  a."id",
  a."actionType",
  a."amount",
  admin."username" as "adminName",
  target."username" as "targetName",
  a."oldValue",
  a."newValue",
  a."createdAt"
FROM "AdminCoinAction" a
LEFT JOIN "User" admin ON a."adminId" = admin."id"
LEFT JOIN "User" target ON a."targetUserId" = target."id"
ORDER BY a."createdAt" DESC
LIMIT 20;
```

### Check User Settings
```sql
SELECT 
  u."username",
  u."balance",
  s."maxBigWin",
  s."currentWin",
  s."cardCustomization",
  s."updatedAt"
FROM "User" u
LEFT JOIN "UserSetting" s ON u."id" = s."userId"
WHERE u."username" = 'john_doe';
```

### Check Specific User's Recent Activities
```sql
SELECT 
  a."actionType",
  a."amount",
  admin."username",
  a."oldValue",
  a."newValue",
  a."createdAt"
FROM "AdminCoinAction" a
LEFT JOIN "User" admin ON a."adminId" = admin."id"
WHERE a."targetUserId" = (SELECT "id" FROM "User" WHERE "username" = 'john_doe')
ORDER BY a."createdAt" DESC;
```

---

## Common Issues & Solutions

### ❌ "Unauthorized"
- Verify admin Discord ID in environment variables
- Check session cookie is valid
- Clear cookies and re-login

### ❌ "User not found"
- Verify user ID format (Discord ID or database UUID)
- Check user exists: `SELECT * FROM "User" WHERE "username" = 'xxx';`
- User must have logged in at least once

### ❌ "Invalid data"
- Check JSON format is valid
- Verify all required fields are present
- Check data types (amount must be number, etc.)

### ✅ Everything Works!
- Check database for created entries
- Monitor balance changes
- Review admin action logs
- Verify custom card settings

---

**Happy testing! 🎉**
