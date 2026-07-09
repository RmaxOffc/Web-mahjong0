# 🎮 Custom Card Integration Guide

## Overview
This guide explains how to integrate the custom card feature with the game board display so users see empty cards instead of symbols when the admin sets custom cards for them.

## Current Implementation Status

✅ **Database:** `UserSetting.cardCustomization` field stores custom card config
✅ **API:** All admin endpoints return card customization data
✅ **Component:** `MahjongTile` supports `isEmpty` prop for empty cards
✅ **Utilities:** `lib/custom-cards.ts` has helper functions ready
⏳ **Game Board:** Needs integration (follow steps below)

---

## Integration Steps

### Step 1: Fetch User Settings on Game Load

In your game board component (e.g., `GameBoard.tsx` or where game initializes):

```typescript
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export function GameBoard() {
  const { data: session } = useSession();
  const [userSettings, setUserSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.discordId) return;

    const fetchUserSettings = async () => {
      try {
        const res = await fetch(
          `/api/admin/user-info?userId=${session.user.discordId}`
        );
        const data = await res.json();
        if (res.ok) {
          setUserSettings(data.user.settings);
        }
      } catch (error) {
        console.error('Failed to fetch user settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserSettings();
  }, [session?.user?.discordId]);

  return (
    <div>
      {loading ? <div>Loading...</div> : <GameContent settings={userSettings} />}
    </div>
  );
}
```

### Step 2: Update Game Result Display

When showing game results, pass the custom card settings to the tile component:

```typescript
import { getDisplaySymbol, isEmptyCard } from '@/lib/custom-cards';

interface GameResultProps {
  result: {
    tier: string;
    label: string;
    payout: number;
  };
  userSettings?: any;
}

export function GameResult({ result, userSettings }: GameResultProps) {
  // Determine what symbol to display
  const displaySymbol = getDisplaySymbol(result.label, userSettings?.cardCustomization);
  const isEmpty = isEmptyCard(userSettings?.cardCustomization);

  return (
    <div className="game-result">
      <MahjongTile
        symbol={displaySymbol}
        revealed={true}
        isEmpty={isEmpty}
        glow={isEmpty ? "jade" : "gold"}
      />
      <div className="result-info">
        <p className="payout">{result.payout} coins!</p>
      </div>
    </div>
  );
}
```

### Step 3: Update the MahjongBoard Component

If you have a board that displays multiple tiles:

```typescript
import MahjongTile from '@/components/MahjongTile';
import { isEmptyCard, getDisplaySymbol } from '@/lib/custom-cards';

interface MahjongBoardProps {
  tiles: any[];
  userSettings?: any;
  revealed?: boolean[];
}

export function MahjongBoard({ tiles, userSettings, revealed = [] }: MahjongBoardProps) {
  const hasEmptyCards = isEmptyCard(userSettings?.cardCustomization);

  return (
    <div className="mahjong-board">
      {tiles.map((tile, index) => (
        <MahjongTile
          key={index}
          symbol={hasEmptyCards ? '' : getDisplaySymbol(tile.label, userSettings?.cardCustomization)}
          revealed={revealed[index] || false}
          isEmpty={hasEmptyCards}
          delay={index * 0.1}
        />
      ))}
    </div>
  );
}
```

### Step 4: Handle Real-time Card Setting Changes

To reflect changes immediately after admin updates custom cards:

```typescript
import { useEffect } from 'react';

// Setup polling or WebSocket listener
useEffect(() => {
  const interval = setInterval(async () => {
    // Refetch settings every 5 seconds
    const res = await fetch(
      `/api/admin/user-info?userId=${session.user.discordId}`
    );
    const data = await res.json();
    if (res.ok) {
      setUserSettings(data.user.settings);
    }
  }, 5000);

  return () => clearInterval(interval);
}, [session?.user?.discordId]);
```

Or use WebSocket for real-time updates (more efficient):

```typescript
useEffect(() => {
  const ws = new WebSocket(`wss://your-server/ws/user/${session.user.discordId}`);
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'SETTINGS_UPDATED') {
      setUserSettings(data.settings);
    }
  };

  return () => ws.close();
}, [session?.user?.discordId]);
```

---

## Complete Example: Integrated Game Component

```typescript
"use client";

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import MahjongTile from '@/components/MahjongTile';
import { getDisplaySymbol, isEmptyCard } from '@/lib/custom-cards';

interface GameResult {
  tier: string;
  label: string;
  payout: number;
  bet: number;
  net: number;
}

export default function GameBoardIntegrated() {
  const { data: session } = useSession();
  const [userSettings, setUserSettings] = useState<any>(null);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);

  // Fetch user settings
  useEffect(() => {
    if (!session?.user?.discordId) return;

    const fetchSettings = async () => {
      try {
        const res = await fetch(
          `/api/admin/user-info?userId=${encodeURIComponent(session.user.discordId)}`
        );
        const data = await res.json();
        if (res.ok) {
          setUserSettings(data.user.settings);
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();

    // Poll for changes every 5 seconds
    const interval = setInterval(fetchSettings, 5000);
    return () => clearInterval(interval);
  }, [session?.user?.discordId]);

  const handlePlayGame = async () => {
    try {
      const response = await fetch('/api/mahjong/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bet: 100 })
      });

      const result = await response.json();
      if (response.ok) {
        setGameResult(result);
        setRevealed(false);
        
        // Auto-reveal after 1 second
        setTimeout(() => setRevealed(true), 1000);
      }
    } catch (error) {
      console.error('Game error:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  const isEmpty = isEmptyCard(userSettings?.cardCustomization);
  const displaySymbol = gameResult 
    ? getDisplaySymbol(gameResult.label, userSettings?.cardCustomization)
    : '';

  return (
    <div className="game-container">
      <div className="game-info">
        <h2>Mahjong Game</h2>
        <p>Balance: {userSettings?.user?.balance || '0'}</p>
        {userSettings?.cardCustomization && (
          <p className="custom-card-notice">
            🃏 Custom cards enabled: {isEmpty ? 'Empty cards' : 'Normal cards'}
          </p>
        )}
      </div>

      <div className="game-board">
        {gameResult ? (
          <MahjongTile
            symbol={displaySymbol}
            revealed={revealed}
            isEmpty={isEmpty}
            glow={isEmpty ? "jade" : "gold"}
            delay={0}
          />
        ) : (
          <div className="placeholder">Click Play to start</div>
        )}
      </div>

      {gameResult && revealed && (
        <div className="result-display">
          <h3>{gameResult.label}</h3>
          <p className="payout">Payout: {gameResult.payout} coins</p>
          <p className="net">Net: {gameResult.net > 0 ? '+' : ''}{gameResult.net}</p>
        </div>
      )}

      <button onClick={handlePlayGame} className="play-button">
        Play (100 coins)
      </button>
    </div>
  );
}
```

---

## Custom Card Display Rules

### Rule 1: Empty Cards
When `cardCustomization.isEmpty === true`:
- Do NOT display any symbol/label
- Pass `isEmpty={true}` to MahjongTile
- Display empty white/cream tile
- Optional: Add special glow effect

```typescript
const isEmpty = userSettings?.cardCustomization?.isEmpty;
<MahjongTile 
  symbol="" 
  isEmpty={isEmpty}
  glow={isEmpty ? "jade" : "gold"}
/>
```

### Rule 2: Symbol Replacement
When custom card is set, use helper function:

```typescript
const symbol = getDisplaySymbol(gameResult.label, userSettings?.cardCustomization);
// Returns: "" if empty, or original label if normal
```

### Rule 3: Caching
Cache user settings to reduce API calls:

```typescript
// Don't fetch every single time - use local state + polling
const [userSettings, setUserSettings] = useState<any>(null);
const [lastFetch, setLastFetch] = useState<number>(0);

const fetchIfNeeded = async () => {
  if (Date.now() - lastFetch < 5000) return; // Wait at least 5 seconds
  const res = await fetch(...);
  setUserSettings(res.json());
  setLastFetch(Date.now());
};
```

---

## Testing Custom Cards

### Test Checklist

- [ ] User without custom card sees normal symbols
- [ ] Admin sets custom card to empty
- [ ] Game reloads and shows empty tile
- [ ] Admin changes it back to normal
- [ ] Symbols appear again
- [ ] Empty tile has different styling (white background)
- [ ] Glow effects work with empty cards
- [ ] Works with all game outcomes (lose, small, big, jackpot)

### Manual Test Steps

1. **Setup:**
   ```bash
   npm run dev
   # Login as user
   # Go to /admin as admin
   ```

2. **Test Empty Cards:**
   - Search user in admin panel
   - Click "Set Kartu Kosong"
   - Go back to game page
   - Refresh page
   - Play game
   - ✅ Verify tile is empty (no symbol)

3. **Test Normal Cards:**
   - Admin: Reset or set normal cards (future feature)
   - User: Refresh page
   - Play game
   - ✅ Verify symbols appear again

---

## API Response Structure

### User Settings with Custom Card

```json
{
  "settings": {
    "id": "setting-uuid",
    "userId": "user-uuid",
    "maxBigWin": 1,
    "currentWin": 0,
    "cardCustomization": {
      "type": "empty",
      "isEmpty": true,
      "timestamp": "2026-07-02T15:35:00.000Z"
    },
    "createdAt": "2026-07-01T10:00:00.000Z",
    "updatedAt": "2026-07-02T15:35:00.000Z"
  }
}
```

### User Settings without Custom Card

```json
{
  "settings": {
    "id": "setting-uuid",
    "userId": "user-uuid",
    "maxBigWin": 1,
    "currentWin": 0,
    "cardCustomization": null,
    "createdAt": "2026-07-01T10:00:00.000Z",
    "updatedAt": "2026-07-01T10:00:00.000Z"
  }
}
```

---

## Styling for Empty Cards

### Default Styling (Already in MahjongTile)
```css
/* Empty card - cream/white background */
background: linear-gradient(135deg, #f5f1de 0%, #e8dcc8 100%);
border: 2px solid rgba(212, 175, 55, 0.2);
```

### Custom Styling Options
```typescript
// Add to MahjongTile props
customColor?: string;

// Usage examples:
<MahjongTile isEmpty={true} customColor="bg-yellow-100" />
<MahjongTile isEmpty={true} customColor="bg-blue-50" />
<MahjongTile isEmpty={true} customColor="bg-pink-100" />
```

---

## Performance Considerations

1. **Cache user settings:** Don't fetch every game
2. **Debounce refresh:** Wait 5 seconds between checks
3. **Use useCallback:** Memoize fetch functions
4. **Lazy load:** Only fetch if user is logged in
5. **Handle errors gracefully:** Show fallback

---

## Future Enhancements

1. **WebSocket for real-time updates**
   - Instant card changes without polling
   - Reduce server load

2. **Multiple Card Types**
   - Empty cards (done ✅)
   - Gradient cards
   - Custom symbols
   - Blurred cards

3. **Card Animation Options**
   - Different flip animations
   - Custom colors per tier
   - Particle effects

4. **Persistent User Preference**
   - Let users choose their own card style
   - Save preference to database

---

## Troubleshooting Integration

### ❌ Empty cards not showing

**Check:**
```typescript
// 1. Verify cardCustomization is fetched
console.log('userSettings:', userSettings);

// 2. Check isEmpty utility
import { isEmptyCard } from '@/lib/custom-cards';
console.log('isEmpty:', isEmptyCard(userSettings?.cardCustomization));

// 3. Verify MahjongTile receives isEmpty prop
<MahjongTile isEmpty={isEmptyCard(userSettings?.cardCustomization)} />
```

### ❌ Settings not updating after admin changes

**Solutions:**
```typescript
// 1. Increase polling frequency
const interval = setInterval(fetchSettings, 2000); // 2 seconds

// 2. Add manual refresh button
<button onClick={() => fetchSettings()}>Refresh</button>

// 3. Check browser DevTools Network tab
// - Should see GET /api/admin/user-info requests
// - Verify responses show updated cardCustomization
```

### ❌ Performance issues

**Optimize:**
```typescript
// 1. Use useMemo for expensive calculations
const isEmpty = useMemo(
  () => isEmptyCard(userSettings?.cardCustomization),
  [userSettings?.cardCustomization]
);

// 2. Stop polling when user inactive
const handleVisibilityChange = () => {
  if (document.hidden) {
    clearInterval(pollInterval);
  } else {
    setupPolling();
  }
};
```

---

**Integration complete! Your game now supports custom empty cards! 🎉**
