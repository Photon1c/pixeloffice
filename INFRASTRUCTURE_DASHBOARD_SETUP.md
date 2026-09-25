# Pixel Office Phase 1: Infrastructure Dashboard Setup

## Overview

Phase 1 infrastructure dashboard provides real-time monitoring of Custodian, Security, and Explorer agents through three integrated React widgets with live API endpoints.

## Components Delivered

### 1. React Widgets (Frontend)

#### VPSHealthWidget (`src/components/VPSHealthWidget.tsx`)
- **Refresh Interval:** 60 seconds
- **Displays:**
  - Gateway status & latency
  - CPU, RAM, Disk usage with progress bars
  - System uptime
  - Ollama status & model count
  - Active cron jobs
  - Critical services status
  - Gate sync status
- **Data Source:** `/api/infrastructure/vps-health`

#### SecurityPatrolWidget (`src/components/SecurityPatrolWidget.tsx`)
- **Refresh Interval:** 10 seconds
- **Displays:**
  - Overall risk level (green/yellow/orange/red)
  - Incident counts by severity (critical/high/medium/low/info)
  - Recent incidents with clickable details
  - Incident categories breakdown
  - Suspicious patterns detected
  - Sensitive environment variables count
- **Data Source:** `/api/infrastructure/security-patrol`

#### ExplorerMaintenanceWidget (`src/components/ExplorerMaintenanceWidget.tsx`)
- **Refresh Interval:** 30 seconds
- **Displays:**
  - File system health status
  - Disk usage with detailed breakdown
  - Largest directories (clickable)
  - Cache sizes (HuggingFace, npm, pip)
  - Git repository status (clean/dirty)
  - Maintenance tasks with scheduling
  - Backup status (ok/overdue/failed)
  - Recommended actions
- **Data Source:** `/api/infrastructure/explorer-maintenance`

### 2. CSS Styling (`src/styles/infrastructure-widgets.css`)

Professional dark-mode infrastructure UI with:
- Cyan/neon accent colors (#00d4ff)
- Status indicators (green healthy, yellow warning, red critical)
- Responsive grid layouts
- Custom scrollbars
- Hover effects and animations
- Mobile-responsive design

### 3. API Endpoints (Backend)

**Router:** `server/api/infrastructure.ts`

#### GET /api/infrastructure/vps-health
```json
{
  "gateway": { "up": boolean, "latency"?: number },
  "disk": { "percentUsed": number, "total": string, "used": string },
  "cpu": { "percentUsed": number },
  "ram": { "percentUsed": number, "total": string, "used": string },
  "services": { [key: string]: boolean },
  "cron": { "active": number, "total": number },
  "ollama": { "running": boolean, "models": number },
  "uptime": { "days": number, "hours": number, "minutes": number },
  "devices": { [key: string]: { "type": string, "status": string } },
  "gates": { [key: string]: { "status": string, "lastSync"?: string } }
}
```

**Data Source:** `/tmp/vps_health.json` (from custodian health collector)
**Fallback:** Computed from system commands (df, free, uptime, etc.)

#### GET /api/infrastructure/security-patrol
```json
{
  "lastScan": "ISO8601 timestamp",
  "scanDuration": number,
  "riskLevel": "green|yellow|orange|red",
  "totalIncidents": number,
  "criticalCount": number,
  "highCount": number,
  "mediumCount": number,
  "lowCount": number,
  "infoCount": number,
  "recentIncidents": [
    {
      "timestamp": "ISO8601",
      "level": "critical|high|medium|low|info",
      "category": string,
      "description": string,
      "source"?: string,
      "resolved"?: boolean
    }
  ],
  "categories": { [key: string]: number },
  "sensitiveEnvVars": number,
  "suspiciousPatterns": [string]
}
```

**Data Source:** `~/.security_patrol.json` (from night auditor)
**Fallback:** Empty incidents list with green risk level

#### GET /api/infrastructure/explorer-maintenance
```json
{
  "timestamp": "ISO8601",
  "diskUsagePercent": number,
  "diskUsageGb": number,
  "diskTotalGb": number,
  "fileCount": number,
  "directoryCount": number,
  "largestDirectories": [
    { "name": string, "sizeGb": number, "fileCount": number }
  ],
  "gitStatus": {
    "[repo-name]": { "status": "clean|dirty|ahead|behind", "files"?: number }
  },
  "maintenanceTasks": [
    {
      "id": string,
      "name": string,
      "status": "pending|running|completed|failed",
      "lastRun"?: "ISO8601",
      "nextScheduled"?: "ISO8601"
    }
  ],
  "fileSystemHealth": "healthy|warning|critical",
  "cacheSize": [
    { "name": string, "sizeGb": number }
  ],
  "recommendedActions": [string],
  "backupStatus": { "lastBackup": "ISO8601", "status": "ok|overdue|failed" }
}
```

**Data Source:** System commands (du, find, git status, etc.)
**Fallback:** Safe computed values

### 4. Dashboard Container (`src/InfrastructureDashboard.tsx`)

Main dashboard component that integrates all three widgets with:
- Header with widget/endpoint counts
- Responsive grid layout (3-column on desktop, 1-column on mobile)
- Footer with data source references
- Dashboard-level metrics display

## Integration Instructions

### Step 1: Add Infrastructure Router to Server

In `server/index.ts`, add these imports at the top:

```typescript
import infrastructureRouter from "./api/infrastructure.js";
```

After `app.use(express.json())`, add:

```typescript
app.use("/api/infrastructure", infrastructureRouter);
```

### Step 2: Export Components from App

In `src/App.tsx` (or your main component), import and export:

```typescript
export { default as InfrastructureDashboard } from "./InfrastructureDashboard";
export { default as VPSHealthWidget } from "./components/VPSHealthWidget";
export { default as SecurityPatrolWidget } from "./components/SecurityPatrolWidget";
export { default as ExplorerMaintenanceWidget } from "./components/ExplorerMaintenanceWidget";
```

### Step 3: Add to Routes

If using React Router, add a new route:

```typescript
import { InfrastructureDashboard } from "./App";

// In your router:
{
  path: "/infrastructure",
  element: <InfrastructureDashboard />
}
```

Or integrate directly into your HUD:

```typescript
<InfrastructureDashboard />
```

### Step 4: Ensure Data Sources Exist

The API endpoints work best when these data sources are available:

- **VPS Health:** `/tmp/vps_health.json` (created by custodian health collector)
- **Security Patrol:** `~/.security_patrol.json` (created by night auditor)
- **Explorer Maintenance:** Computed from system commands (no file required)

If these files don't exist, the API will compute fallback values from system commands.

## Data Refresh Intervals

- **VPS Health Widget:** 60 seconds (stable long-term metrics)
- **Security Patrol Widget:** 10 seconds (active threat monitoring)
- **Explorer Maintenance Widget:** 30 seconds (moderate-frequency health checks)

All refresh intervals are configurable in the component `useEffect` hooks.

## Color Coding

### Health Status
- 🟢 **Healthy:** Green (#4ade80) - < 60% usage or clean state
- 🟡 **Warning:** Yellow (#facc15) - 60-80% usage or attention needed
- 🟠 **High:** Orange (#f97316) - 80-90% usage or significant issues
- 🔴 **Critical:** Red (#ef4444) - > 90% usage or critical issues

### Risk Levels
- **Green:** No incidents, system healthy
- **Yellow:** Low-severity incidents, minor issues
- **Orange:** Medium-severity incidents, needs attention
- **Red:** Critical incidents, immediate action needed

## Testing

### Test VPS Health Endpoint

```bash
curl http://localhost:4173/api/infrastructure/vps-health | jq .
```

Expected: Gateway status, CPU/RAM/disk metrics, services list

### Test Security Patrol Endpoint

```bash
curl http://localhost:4173/api/infrastructure/security-patrol | jq .
```

Expected: Risk level, incident counts, recent incidents

### Test Explorer Maintenance Endpoint

```bash
curl http://localhost:4173/api/infrastructure/explorer-maintenance | jq .
```

Expected: Disk usage, git repos, cache sizes, maintenance tasks

### Test in Browser

Visit:
- `http://localhost:4173/infrastructure` (if routed)
- Or check browser console if embedded in HUD

## File Locations

```
pixel_office/
├── src/
│   ├── components/
│   │   ├── VPSHealthWidget.tsx
│   │   ├── SecurityPatrolWidget.tsx
│   │   └── ExplorerMaintenanceWidget.tsx
│   ├── styles/
│   │   ├── infrastructure-widgets.css
│   │   └── infrastructure-dashboard.css
│   └── InfrastructureDashboard.tsx
└── server/
    └── api/
        ├── infrastructure.ts (main API router)
        └── infrastructure-integration.ts (setup guide)
```

## Next Steps (Phase 2)

- Real-time WebSocket updates instead of polling
- Historical data storage and trend analysis
- Alert thresholds with notifications
- Custom widget configuration per user
- Integration with OpenClaw dashboard widgets
- Performance metrics and reporting

## Architecture Notes

### API Design
- **Stateless:** Each endpoint computes fresh data from source files/system
- **Fallback Resilient:** Falls back to computed values if data files unavailable
- **Extensible:** Easy to add new metrics or data sources

### Widget Design
- **Self-contained:** Each widget manages its own state and refresh interval
- **Error Handling:** Graceful error displays with retry logic
- **Responsive:** Works on desktop, tablet, mobile
- **Accessible:** Semantic HTML, ARIA labels, high contrast

### Performance
- **Efficient Rendering:** React memoization, minimal re-renders
- **Staggered Refresh:** Different intervals prevent simultaneous API calls
- **CSS Optimization:** Hardware-accelerated animations, optimized selectors

## Troubleshooting

### Widgets Show "Loading..." Forever

1. Check server is running: `curl http://localhost:4173/api/infrastructure/vps-health`
2. Check console for CORS errors
3. Verify API endpoints are registered in `server/index.ts`

### Data Not Updating

1. Check refresh intervals in component hooks
2. Verify data sources exist (`/tmp/vps_health.json`, etc.)
3. Check network tab in browser DevTools for failed requests

### High CPU Usage

1. Reduce refresh intervals if not needed
2. Check for memory leaks in browser DevTools
3. Limit number of largest directories displayed

## Support

For issues or questions, refer to:
- Infrastructure agent documentation
- Pixel Office server logs
- Browser DevTools console and network tab

---

**Status:** Phase 1 Complete ✅
**Widgets:** 3 (VPS, Security, Explorer)
**API Endpoints:** 3
**Refresh Intervals:** 60s / 10s / 30s
**Last Updated:** 2026-09-24
