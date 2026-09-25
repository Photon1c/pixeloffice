# Infrastructure Dashboard Quick Start Guide

## 5-Minute Setup

### 1. Copy Components to Your Project

All components are in `src/components/` and `src/styles/`:
- ✅ `VPSHealthWidget.tsx`
- ✅ `SecurityPatrolWidget.tsx`
- ✅ `ExplorerMaintenanceWidget.tsx`
- ✅ `infrastructure-widgets.css`
- ✅ `infrastructure-dashboard.css`

### 2. Add API Router to Server

In `server/index.ts`, after your express app is initialized:

```typescript
import infrastructureRouter from "./api/infrastructure.js";

// Add after app.use(express.json()):
app.use("/api/infrastructure", infrastructureRouter);
```

### 3. Import Dashboard in Your App

In your main component (e.g., `src/App.tsx`):

```typescript
import { InfrastructureDashboard } from "./InfrastructureDashboard";

// Add to your component tree:
<InfrastructureDashboard />

// OR import individual widgets:
import VPSHealthWidget from "./components/VPSHealthWidget";
import SecurityPatrolWidget from "./components/SecurityPatrolWidget";
import ExplorerMaintenanceWidget from "./components/ExplorerMaintenanceWidget";
```

### 4. Verify Endpoints

Test the API:

```bash
# VPS Health
curl http://localhost:4173/api/infrastructure/vps-health | jq .

# Security Patrol
curl http://localhost:4173/api/infrastructure/security-patrol | jq .

# Explorer Maintenance
curl http://localhost:4173/api/infrastructure/explorer-maintenance | jq .
```

Expected: JSON responses with metrics data

## Testing Widgets Locally

### Option A: With Mock Data

Use the example JSON files in `examples/`:

```bash
# Create test data directory
mkdir -p /tmp
cp examples/mock-vps-health.json /tmp/vps_health.json

# API will now serve real data from the file
curl http://localhost:4173/api/infrastructure/vps-health
```

### Option B: In Browser DevTools

1. Open browser console
2. Try fetch:

```javascript
fetch('/api/infrastructure/vps-health')
  .then(r => r.json())
  .then(console.log);
```

### Option C: Standalone Test

Run the test suite:

```bash
npm test -- infrastructure-api.test.ts
```

## Widgets Overview

| Widget | Refresh | Purpose | Data Source |
|--------|---------|---------|-------------|
| **VPSHealthWidget** | 60s | CPU/RAM/Disk metrics, gateway status, services, uptime | `/tmp/vps_health.json` |
| **SecurityPatrolWidget** | 10s | Security incidents, risk level, suspicious patterns | `~/.security_patrol.json` |
| **ExplorerMaintenanceWidget** | 30s | Disk usage, git repos, caches, backups, recommendations | System commands |

## Color Meanings

### Health Status
- 🟢 **Green**: Healthy (< 60% usage)
- 🟡 **Yellow**: Warning (60-80% usage)
- 🟠 **Orange**: High (80-90% usage)
- 🔴 **Red**: Critical (> 90% usage)

### Risk Levels
- **Green**: No incidents
- **Yellow**: Low severity incidents
- **Orange**: Medium severity incidents
- **Red**: Critical incidents

## Data Sources

The API pulls from real infrastructure sources:

### VPS Health
- **Primary:** `/tmp/vps_health.json` (custodian collector)
- **Fallback:** System commands (df, free, uptime, etc.)

### Security Patrol
- **Primary:** `~/.security_patrol.json` (night auditor)
- **Fallback:** Empty incidents, green risk level

### Explorer Maintenance
- **Primary:** System commands (du, find, git status)
- **Fallback:** Computed safe values

## Customization

### Change Refresh Intervals

In component files, modify the `setInterval` value:

```typescript
// VPSHealthWidget.tsx - change from 60000ms to 30000ms:
const interval = setInterval(fetchHealth, 30000); // 30s instead of 60s
```

### Change Widget Colors

Edit `infrastructure-widgets.css`:

```css
/* Change healthy color from green to blue */
.metric-bar.healthy {
  background: linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%);
}
```

### Add New Metrics

Add fields to API response in `server/api/infrastructure.ts`:

```typescript
// Add to VPSHealthResponse interface:
networkBandwidth: { in: number; out: number };

// Add to helper function:
networkBandwidth: {
  in: Math.random() * 100,
  out: Math.random() * 50,
}
```

Then display in widget component.

## Troubleshooting

### Widgets Show "Loading..." Forever

**Issue:** API endpoints not responding

**Solution:**
```bash
# Check server is running on correct port
netstat -tlnp | grep 4173

# Check API endpoint directly
curl -v http://localhost:4173/api/infrastructure/vps-health

# Check server logs for errors
# Look for import errors, missing files, etc.
```

### Data Not Updating

**Issue:** Refresh interval not working

**Solution:**
```javascript
// Check in browser console
// Open DevTools → Network tab
// Watch for API calls every 60s / 10s / 30s

// If not seeing requests, check:
// 1. Are widgets mounted?
// 2. Are useEffect hooks running?
// 3. Check console for fetch errors
```

### High CPU Usage

**Issue:** Too many API calls

**Solution:**
1. Increase refresh intervals
2. Reduce number of largest directories displayed
3. Check for memory leaks in DevTools

### CORS Errors

**Issue:** API blocked by browser

**Solution:**
```typescript
// In server/index.ts, ensure CORS is set up:
import cors from 'cors';
app.use(cors());
```

## Integration Examples

### Add to Existing Dashboard

```typescript
import InfrastructureDashboard from "./InfrastructureDashboard";

export function Dashboard() {
  return (
    <div className="dashboard">
      <h1>Control Center</h1>
      <InfrastructureDashboard />
      {/* Your other dashboard content */}
    </div>
  );
}
```

### Embed Single Widget

```typescript
import VPSHealthWidget from "./components/VPSHealthWidget";

export function Header() {
  return (
    <header>
      <h1>System Status</h1>
      <VPSHealthWidget />
    </header>
  );
}
```

### Create Custom Container

```typescript
export function InfraMonitor() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      <VPSHealthWidget />
      <SecurityPatrolWidget />
    </div>
  );
}
```

## Next Steps

1. ✅ Components created and tested
2. ✅ API endpoints implemented with fallbacks
3. ✅ CSS styling complete with dark mode
4. ✅ Documentation and examples provided
5. 📋 Phase 2 (optional):
   - WebSocket real-time updates
   - Historical data storage
   - Trend analysis and alerts
   - Custom thresholds per widget
   - Export/reporting features

## File Checklist

Verify all files are in place:

```
pixel_office/
├── src/
│   ├── components/
│   │   ├── VPSHealthWidget.tsx ✓
│   │   ├── SecurityPatrolWidget.tsx ✓
│   │   └── ExplorerMaintenanceWidget.tsx ✓
│   ├── styles/
│   │   ├── infrastructure-widgets.css ✓
│   │   └── infrastructure-dashboard.css ✓
│   └── InfrastructureDashboard.tsx ✓
├── server/
│   └── api/
│       ├── infrastructure.ts ✓
│       └── infrastructure-integration.ts ✓
├── tests/
│   └── infrastructure-api.test.ts ✓
├── examples/
│   ├── mock-vps-health.json ✓
│   ├── mock-security-patrol.json ✓
│   └── mock-explorer-maintenance.json ✓
├── INFRASTRUCTURE_DASHBOARD_SETUP.md ✓
└── QUICK_START.md (this file) ✓
```

## Support

For help:

1. Check `INFRASTRUCTURE_DASHBOARD_SETUP.md` for detailed docs
2. Review example data in `examples/`
3. Run tests: `npm test -- infrastructure-api.test.ts`
4. Check browser console for errors
5. Review server logs for API issues

---

**Status:** ✅ Phase 1 Complete
**Components:** 3 widgets + 3 API endpoints
**Test Coverage:** Full unit tests included
**Ready to Deploy:** Yes

