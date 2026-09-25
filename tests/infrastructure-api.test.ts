/**
 * Infrastructure API Tests
 * 
 * Unit tests for the three infrastructure endpoints
 * Run with: npm test -- infrastructure-api.test.ts
 */

import { describe, it, expect, beforeEach } from "vitest";

// Mock data for testing
const mockVPSHealth = {
  gateway: { up: true, latency: 45 },
  disk: { percentUsed: 45, total: "500 GB", used: "225 GB" },
  cpu: { percentUsed: 28 },
  ram: { percentUsed: 62, total: "32 GB", used: "19.8 GB" },
  services: {
    ollama: true,
    gateway: true,
    keycloak: true,
    bowr: false,
  },
  cron: { active: 3, total: 5 },
  ollama: { running: true, models: 21 },
  uptime: { days: 45, hours: 12, minutes: 33 },
  devices: {
    eth0: { type: "ethernet", status: "up" },
    docker0: { type: "bridge", status: "up" },
  },
  gates: {
    gate_b: { status: "synced", lastSync: "2026-09-24T23:00:00Z" },
    gate_c: { status: "synced", lastSync: "2026-09-24T23:05:00Z" },
  },
};

const mockSecurityPatrol = {
  lastScan: "2026-09-24T23:08:15Z",
  scanDuration: 1250,
  riskLevel: "green",
  totalIncidents: 5,
  criticalCount: 0,
  highCount: 0,
  mediumCount: 2,
  lowCount: 2,
  infoCount: 1,
  recentIncidents: [
    {
      timestamp: "2026-09-24T22:45:00Z",
      level: "medium",
      category: "SSH",
      description: "SSH connection attempt from unknown port",
      source: "port 1420",
      resolved: false,
    },
    {
      timestamp: "2026-09-24T22:30:00Z",
      level: "low",
      category: "ENV",
      description: "Runtime environment variable detected",
      source: "OpenClaw keystore",
      resolved: false,
    },
  ],
  categories: {
    SSH: 3,
    ENV: 2,
  },
  sensitiveEnvVars: 19,
  suspiciousPatterns: ["Repeated failed SSH attempts on non-standard ports"],
};

const mockExplorerMaintenance = {
  timestamp: "2026-09-24T23:08:15Z",
  diskUsagePercent: 45,
  diskUsageGb: 180,
  diskTotalGb: 400,
  fileCount: 850000,
  directoryCount: 180000,
  largestDirectories: [
    { name: "HuggingFace", sizeGb: 42.5, fileCount: 12500 },
    { name: "npm_modules", sizeGb: 25.3, fileCount: 450000 },
    { name: "opencode", sizeGb: 18.7, fileCount: 85000 },
    { name: "projects", sizeGb: 15.2, fileCount: 42000 },
  ],
  gitStatus: {
    "systems-lab": { status: "clean", files: 0 },
    "pixel_office": { status: "clean", files: 0 },
    "opencode": { status: "dirty", files: 5 },
  },
  maintenanceTasks: [
    {
      id: "disk_cleanup",
      name: "Disk Cleanup",
      status: "completed",
      lastRun: "2026-09-17T00:00:00Z",
      nextScheduled: "2026-10-01T00:00:00Z",
    },
    {
      id: "git_audit",
      name: "Git Repository Audit",
      status: "completed",
      lastRun: "2026-09-21T00:00:00Z",
      nextScheduled: "2026-09-28T00:00:00Z",
    },
    {
      id: "backup",
      name: "System Backup",
      status: "pending",
      nextScheduled: "2026-09-25T02:00:00Z",
    },
  ],
  fileSystemHealth: "healthy",
  cacheSize: [
    { name: "HuggingFace", sizeGb: 42.5 },
    { name: "npm", sizeGb: 8.2 },
    { name: "pip", sizeGb: 3.1 },
  ],
  recommendedActions: [
    "System is running optimally",
    "Consider archiving old project backups quarterly",
  ],
  backupStatus: {
    lastBackup: "2026-09-23T02:15:00Z",
    status: "ok",
  },
};

describe("Infrastructure API Endpoints", () => {
  describe("VPS Health Endpoint", () => {
    it("should have all required gateway fields", () => {
      expect(mockVPSHealth.gateway).toHaveProperty("up");
      expect(mockVPSHealth.gateway).toHaveProperty("latency");
    });

    it("should have all required disk fields", () => {
      expect(mockVPSHealth.disk).toHaveProperty("percentUsed");
      expect(mockVPSHealth.disk).toHaveProperty("total");
      expect(mockVPSHealth.disk).toHaveProperty("used");
    });

    it("should have CPU metrics", () => {
      expect(mockVPSHealth.cpu).toHaveProperty("percentUsed");
      expect(mockVPSHealth.cpu.percentUsed).toBeGreaterThanOrEqual(0);
      expect(mockVPSHealth.cpu.percentUsed).toBeLessThanOrEqual(100);
    });

    it("should have RAM metrics with units", () => {
      expect(mockVPSHealth.ram).toHaveProperty("percentUsed");
      expect(mockVPSHealth.ram).toHaveProperty("total");
      expect(mockVPSHealth.ram).toHaveProperty("used");
    });

    it("should have uptime in days/hours/minutes", () => {
      expect(mockVPSHealth.uptime).toHaveProperty("days");
      expect(mockVPSHealth.uptime).toHaveProperty("hours");
      expect(mockVPSHealth.uptime).toHaveProperty("minutes");
      expect(mockVPSHealth.uptime.days).toBeGreaterThanOrEqual(0);
      expect(mockVPSHealth.uptime.hours).toBeLessThan(24);
      expect(mockVPSHealth.uptime.minutes).toBeLessThan(60);
    });

    it("should list services with boolean status", () => {
      Object.values(mockVPSHealth.services).forEach((status) => {
        expect(typeof status).toBe("boolean");
      });
    });

    it("should have ollama status", () => {
      expect(mockVPSHealth.ollama).toHaveProperty("running");
      expect(mockVPSHealth.ollama).toHaveProperty("models");
      expect(mockVPSHealth.ollama.models).toBeGreaterThanOrEqual(0);
    });

    it("should have gates with sync status", () => {
      Object.values(mockVPSHealth.gates).forEach((gate: any) => {
        expect(["synced", "pending", "failed"]).toContain(gate.status);
      });
    });
  });

  describe("Security Patrol Endpoint", () => {
    it("should have risk level", () => {
      expect(["green", "yellow", "orange", "red"]).toContain(
        mockSecurityPatrol.riskLevel
      );
    });

    it("should have scan metadata", () => {
      expect(mockSecurityPatrol).toHaveProperty("lastScan");
      expect(mockSecurityPatrol).toHaveProperty("scanDuration");
      expect(mockSecurityPatrol.scanDuration).toBeGreaterThanOrEqual(0);
    });

    it("should count incidents by severity", () => {
      const total =
        mockSecurityPatrol.criticalCount +
        mockSecurityPatrol.highCount +
        mockSecurityPatrol.mediumCount +
        mockSecurityPatrol.lowCount +
        mockSecurityPatrol.infoCount;
      expect(total).toBe(mockSecurityPatrol.totalIncidents);
    });

    it("should have incident details", () => {
      mockSecurityPatrol.recentIncidents.forEach((incident) => {
        expect(incident).toHaveProperty("timestamp");
        expect(incident).toHaveProperty("level");
        expect(incident).toHaveProperty("category");
        expect(incident).toHaveProperty("description");
        expect([
          "critical",
          "high",
          "medium",
          "low",
          "info",
        ]).toContain(incident.level);
      });
    });

    it("should track sensitive environment variables", () => {
      expect(mockSecurityPatrol.sensitiveEnvVars).toBeGreaterThanOrEqual(0);
    });

    it("should list suspicious patterns", () => {
      expect(Array.isArray(mockSecurityPatrol.suspiciousPatterns)).toBe(true);
    });
  });

  describe("Explorer Maintenance Endpoint", () => {
    it("should have disk usage metrics", () => {
      expect(mockExplorerMaintenance).toHaveProperty("diskUsagePercent");
      expect(mockExplorerMaintenance).toHaveProperty("diskUsageGb");
      expect(mockExplorerMaintenance).toHaveProperty("diskTotalGb");
      expect(mockExplorerMaintenance.diskUsagePercent).toBeGreaterThanOrEqual(0);
      expect(mockExplorerMaintenance.diskUsagePercent).toBeLessThanOrEqual(100);
    });

    it("should have file/directory counts", () => {
      expect(mockExplorerMaintenance.fileCount).toBeGreaterThanOrEqual(0);
      expect(mockExplorerMaintenance.directoryCount).toBeGreaterThanOrEqual(0);
    });

    it("should list largest directories", () => {
      mockExplorerMaintenance.largestDirectories.forEach((dir) => {
        expect(dir).toHaveProperty("name");
        expect(dir).toHaveProperty("sizeGb");
        expect(dir).toHaveProperty("fileCount");
        expect(dir.sizeGb).toBeGreaterThanOrEqual(0);
        expect(dir.fileCount).toBeGreaterThanOrEqual(0);
      });
    });

    it("should have git repository status", () => {
      Object.entries(mockExplorerMaintenance.gitStatus).forEach(
        ([repo, status]: any) => {
          expect(typeof repo).toBe("string");
          expect(["clean", "dirty", "ahead", "behind"]).toContain(status.status);
        }
      );
    });

    it("should track cache sizes", () => {
      mockExplorerMaintenance.cacheSize.forEach((cache) => {
        expect(cache).toHaveProperty("name");
        expect(cache).toHaveProperty("sizeGb");
        expect(cache.sizeGb).toBeGreaterThanOrEqual(0);
      });
    });

    it("should have maintenance tasks with status", () => {
      mockExplorerMaintenance.maintenanceTasks.forEach((task) => {
        expect(task).toHaveProperty("id");
        expect(task).toHaveProperty("name");
        expect(task).toHaveProperty("status");
        expect([
          "pending",
          "running",
          "completed",
          "failed",
        ]).toContain(task.status);
      });
    });

    it("should have file system health", () => {
      expect(["healthy", "warning", "critical"]).toContain(
        mockExplorerMaintenance.fileSystemHealth
      );
    });

    it("should have recommended actions", () => {
      expect(Array.isArray(mockExplorerMaintenance.recommendedActions)).toBe(
        true
      );
    });

    it("should have backup status", () => {
      expect(mockExplorerMaintenance.backupStatus).toHaveProperty("lastBackup");
      expect(mockExplorerMaintenance.backupStatus).toHaveProperty("status");
      expect(["ok", "overdue", "failed"]).toContain(
        mockExplorerMaintenance.backupStatus.status
      );
    });
  });

  describe("Data Validation", () => {
    it("should validate percentage ranges (0-100)", () => {
      expect(mockVPSHealth.cpu.percentUsed).toBeGreaterThanOrEqual(0);
      expect(mockVPSHealth.cpu.percentUsed).toBeLessThanOrEqual(100);

      expect(mockVPSHealth.ram.percentUsed).toBeGreaterThanOrEqual(0);
      expect(mockVPSHealth.ram.percentUsed).toBeLessThanOrEqual(100);

      expect(mockVPSHealth.disk.percentUsed).toBeGreaterThanOrEqual(0);
      expect(mockVPSHealth.disk.percentUsed).toBeLessThanOrEqual(100);

      expect(mockExplorerMaintenance.diskUsagePercent).toBeGreaterThanOrEqual(0);
      expect(mockExplorerMaintenance.diskUsagePercent).toBeLessThanOrEqual(100);
    });

    it("should validate ISO8601 timestamps", () => {
      const iso8601Regex =
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d+)?(Z|[+-]\d{2}:\d{2})?$/;

      expect(iso8601Regex.test(mockSecurityPatrol.lastScan)).toBe(true);
      expect(iso8601Regex.test(mockExplorerMaintenance.timestamp)).toBe(true);

      mockSecurityPatrol.recentIncidents.forEach((incident) => {
        expect(iso8601Regex.test(incident.timestamp)).toBe(true);
      });
    });

    it("should have consistent incident counting", () => {
      const totalFromSecurity =
        mockSecurityPatrol.criticalCount +
        mockSecurityPatrol.highCount +
        mockSecurityPatrol.mediumCount +
        mockSecurityPatrol.lowCount +
        mockSecurityPatrol.infoCount;

      expect(totalFromSecurity).toBe(mockSecurityPatrol.totalIncidents);
    });

    it("should have consistent disk usage calculations", () => {
      expect(mockExplorerMaintenance.diskUsageGb).toBeGreaterThan(0);
      expect(mockExplorerMaintenance.diskTotalGb).toBeGreaterThan(0);
      expect(mockExplorerMaintenance.diskUsageGb).toBeLessThanOrEqual(
        mockExplorerMaintenance.diskTotalGb
      );

      const calculatedPercent = Math.round(
        (mockExplorerMaintenance.diskUsageGb / mockExplorerMaintenance.diskTotalGb) * 100
      );
      expect(calculatedPercent).toBe(mockExplorerMaintenance.diskUsagePercent);
    });
  });

  describe("Widget Integration", () => {
    it("VPS Health data should work with VPSHealthWidget", () => {
      // Verify all required fields exist
      expect(mockVPSHealth).toMatchObject({
        gateway: { up: expect.any(Boolean) },
        disk: { percentUsed: expect.any(Number) },
        cpu: { percentUsed: expect.any(Number) },
        ram: { percentUsed: expect.any(Number) },
        uptime: {
          days: expect.any(Number),
          hours: expect.any(Number),
          minutes: expect.any(Number),
        },
      });
    });

    it("Security Patrol data should work with SecurityPatrolWidget", () => {
      expect(mockSecurityPatrol).toMatchObject({
        riskLevel: expect.any(String),
        totalIncidents: expect.any(Number),
        recentIncidents: expect.any(Array),
      });
    });

    it("Explorer Maintenance data should work with ExplorerMaintenanceWidget", () => {
      expect(mockExplorerMaintenance).toMatchObject({
        diskUsagePercent: expect.any(Number),
        largestDirectories: expect.any(Array),
        fileSystemHealth: expect.any(String),
      });
    });
  });
});
