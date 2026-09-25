/**
 * Infrastructure API Integration
 * 
 * This file demonstrates how to integrate the infrastructure endpoints into the Pixel Office server.
 * Add this to your server/index.ts after the express app is initialized:
 * 
 * import infrastructureRouter from "./api/infrastructure.js";
 * app.use("/api/infrastructure", infrastructureRouter);
 * 
 * The endpoints will then be available at:
 * - GET /api/infrastructure/vps-health (60s refresh)
 * - GET /api/infrastructure/security-patrol (10s refresh)
 * - GET /api/infrastructure/explorer-maintenance (30s refresh)
 */

// Copy this import and use statement into server/index.ts:
// import infrastructureRouter from "./api/infrastructure.js";
// app.use("/api/infrastructure", infrastructureRouter);

// The infrastructure API router is defined in infrastructure.ts and exports:
// - /vps-health: Real-time VPS metrics (CPU, RAM, disk, gateway, services, cron, ollama, gates)
// - /security-patrol: Security incidents and risk assessment
// - /explorer-maintenance: Workspace health, disk usage, git repos, maintenance tasks, backups

export default {
  description:
    "Infrastructure API Integration for Pixel Office Phase 1 Dashboard",
  setupCode: `
import infrastructureRouter from "./api/infrastructure.js";
app.use("/api/infrastructure", infrastructureRouter);
`,
  endpoints: [
    {
      path: "/api/infrastructure/vps-health",
      method: "GET",
      refreshInterval: "60s",
      component: "VPSHealthWidget",
      description: "VPS health metrics (CPU, RAM, disk, uptime, services)",
    },
    {
      path: "/api/infrastructure/security-patrol",
      method: "GET",
      refreshInterval: "10s",
      component: "SecurityPatrolWidget",
      description: "Security incidents, risk assessment, suspicious patterns",
    },
    {
      path: "/api/infrastructure/explorer-maintenance",
      method: "GET",
      refreshInterval: "30s",
      component: "ExplorerMaintenanceWidget",
      description:
        "Workspace health, disk usage, git repos, maintenance tasks, backups",
    },
  ],
};
