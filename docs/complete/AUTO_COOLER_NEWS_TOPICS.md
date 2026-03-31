# Auto-Cooler & News Topics Implementation

**Date:** 2026-03-19  
**Feature:** Automatic Cooler Sessions with News Topics  
**Status:** Complete

## Goal

1. Improve cooler sessions with varied, interesting topics
2. Trigger cooler sessions automatically every 20 minutes
3. Agents get a chance to "stretch their legs" regularly

## Files Created

### server/services/newsTopics.ts

News topic service that provides conversation starters:

**Features:**
- Fetches from NewsAPI if configured
- Falls back to curated tech/science/workplace topics
- Caches topics for 30 minutes
- Random topic selection

**Configuration:**
```bash
NEWS_API_URL=https://newsapi.org/v2/top-headlines
NEWS_API_KEY=your_api_key_here  # Optional
```

**Fallback Topics Include:**
- Latest developments in AI
- Climate change initiatives
- Remote work trends
- Sustainability in technology
- Health and wellness
- Work-life balance
- Quantum computing breakthroughs

## Files Modified

### server/services/coolerTalkService.ts

- Added news topic import
- Auto-selects news topic when topic is "auto", "news", or empty

### server/index.ts

Added new API endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/cooler/auto/start` | POST | Start auto-cooler (runs every 20 min) |
| `/api/cooler/auto/stop` | POST | Stop auto-cooler |
| `/api/cooler/auto/status` | GET | Get auto-cooler status |
| `/api/cooler/auto/trigger` | POST | Trigger immediate session |
| `/api/cooler/topics` | GET | Get available news topics |

## How It Works

1. **Manual Trigger:**
   ```bash
   curl -X POST http://localhost:4173/api/cooler/auto/trigger
   ```

2. **Auto Mode:**
   ```bash
   curl -X POST http://localhost:4173/api/cooler/auto/start
   # Runs immediately, then every 20 minutes
   ```

3. **Topic Selection:**
   - Uses news topics by default
   - All 8 agents participate
   - Each agent speaks once in sequence

## Test Results

```
=== Start auto-cooler ===
{"ok":true,"message":"Auto-cooler started","intervalMs":1200000}

=== Get topics ===
{"topics":[
  {"title":"Cybersecurity best practices","category":"tech"},
  {"title":"Health and wellness in the workplace","category":"wellness"},
  {"title":"Remote work trends and office culture","category":"workplace"},
  ...
]}

=== Server Log ===
[AutoCooler] Session complete. 8 participants, topic: "Work-life balance strategies"
[AutoCooler] Started. Next session in 20 minutes
```

## Build Verification

```bash
npm run build  # ✓ Successful
```

## Usage

### Start Auto Sessions
```bash
curl -X POST http://localhost:4173/api/cooler/auto/start
```

### Stop Auto Sessions
```bash
curl -X POST http://localhost:4173/api/cooler/auto/stop
```

### Trigger Single Session with News Topic
```bash
curl -X POST http://localhost:4173/api/cooler/auto/trigger
```

### View Available Topics
```bash
curl http://localhost:4173/api/cooler/topics
```

## Benefits

- Agents regularly move around the office
- Conversations are varied and interesting
- No manual intervention required
- Falls back gracefully when news API unavailable
