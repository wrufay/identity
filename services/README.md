# Mock Services & SRS System

## Overview

This directory contains mock services for **Snowflake** and **Amplitude** analytics, plus a fully functional **Spaced Repetition System (SRS)** using local JSON storage.

## Files

- **`analytics.ts`** - Mock analytics service that logs all behavioral events to console
- **`srs.ts`** - Spaced repetition algorithm (SM-2) with local AsyncStorage persistence

## Analytics Service

### Usage

```typescript
import { Analytics, AnalyticsEvents } from '@/services/analytics';

// Track an event
Analytics.track(AnalyticsEvents.SCAN_SUCCESS, 'user_123', {
  word: '饺子',
  english: 'dumpling',
});
```

### Behavioral Events Tracked

Every behavioral event is automatically logged to the console with this format:

```
📊 BEHAVIORAL EVENT FIRED: scan_success
🔵 SNOWFLAKE EVENT: {
  "eventName": "[SNOWFLAKE] scan_success",
  "userId": "user_123",
  "timestamp": "2024-01-17T10:30:00.000Z",
  "properties": { "word": "饺子", "english": "dumpling" }
}
🟣 AMPLITUDE EVENT: {
  "eventName": "[AMPLITUDE] scan_success",
  "userId": "user_123",
  "timestamp": "2024-01-17T10:30:00.000Z",
  "properties": { "word": "饺子", "english": "dumpling" }
}
```

### Available Events

- `APP_OPENED` / `APP_CLOSED`
- `VR_MODE_ENABLED` / `VR_MODE_DISABLED`
- `SCAN_INITIATED` / `SCAN_SUCCESS` / `SCAN_FAILED`
- `WORD_DISCOVERED` / `WORD_REVIEWED`
- `AUDIO_PLAYED`
- `OVERLAY_OPENED` / `OVERLAY_CLOSED`
- `CULTURAL_CONTEXT_VIEWED`
- `SRS_CARD_DUE` / `SRS_CARD_ANSWERED` / `SRS_LEVEL_UP`

## SRS System

### Features

- **SM-2 Algorithm** - Optimal spaced repetition intervals
- **Local Storage** - Uses React Native AsyncStorage
- **Automatic Tracking** - Integrates with analytics
- **Review Quality** - 4 levels (Again, Hard, Good, Easy)

### Usage

```typescript
import { SRS, ReviewQuality } from '@/services/srs';

// Initialize (loads from storage)
await SRS.loadCards();

// Add a new word
const card = await SRS.addCard(
  'user_123',
  'dumpling',
  '饺子',
  'jiǎozi',
  'Cultural context here...'
);

// Review a card
await SRS.reviewCard(card.id, ReviewQuality.GOOD);

// Get due cards
const dueCards = await SRS.getDueCards('user_123');

// Get statistics
const stats = await SRS.getStats('user_123');
console.log(stats);
// { totalCards: 10, dueCards: 3, totalReviews: 25, accuracy: 85.5 }
```

### Review Quality Levels

- **AGAIN (0)** - Complete blackout, forgot entirely → Interval resets to 1 day
- **HARD (1)** - Incorrect but remembered something → Interval resets to 1 day
- **GOOD (2)** - Correct with hesitation → Normal progression
- **EASY (3)** - Perfect recall → Aggressive progression

### Algorithm Details

The SM-2 algorithm calculates the next review interval based on:
- **Ease Factor** - How "easy" the card is (starts at 2.5)
- **Interval** - Days until next review
- **Repetitions** - Number of consecutive correct reviews

**First review:** 1 day
**Second review:** 6 days
**Third+ review:** Previous interval × ease factor

### Data Storage

All data is stored locally in AsyncStorage under the key `@vocabulary_srs`. Data persists between app sessions.

### Testing

To clear all data for testing:

```typescript
await SRS.clearAll();
```

## Integration with App

The main AR app (`app/(tabs)/index.tsx`) automatically:

1. ✅ Tracks all user interactions
2. ✅ Adds scanned words to SRS system
3. ✅ Shows review count badges
4. ✅ Logs all events to console

## Console Output Example

When you scan an object, you'll see:

```
📊 BEHAVIORAL EVENT FIRED: scan_initiated
🔵 SNOWFLAKE EVENT: { ... }
🟣 AMPLITUDE EVENT: { ... }
📊 BEHAVIORAL EVENT FIRED: scan_success
🆕 New SRS card created: 饺子 (dumpling)
📊 BEHAVIORAL EVENT FIRED: word_discovered
💾 Saved 1 SRS cards to storage
📊 BEHAVIORAL EVENT FIRED: overlay_opened
```

## Development Tips

- Open the debugger console to see all events in real-time
- Events are buffered and can be retrieved with `Analytics.getEventBuffer()`
- SRS data persists between app restarts
- Use `SRS.clearAll()` to reset for testing
