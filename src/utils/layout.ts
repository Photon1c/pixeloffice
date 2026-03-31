import { Agent } from "../types";

export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 800;
export const STATUS_BAR_HEIGHT = 80;

// ============================================================================
// GRID SYSTEM (5 cols x 3 rows)
// ============================================================================
export const GRID_COLS = 5;
export const GRID_ROWS = 3;
export const CELL_WIDTH = CANVAS_WIDTH / GRID_COLS; // 240px
export const CELL_HEIGHT = (CANVAS_HEIGHT - STATUS_BAR_HEIGHT) / GRID_ROWS; // 240px

// Standard padding inside rooms to prevent props from touching walls
export const ROOM_PADDING = 15;

// ============================================================================
// SPATIAL COMPOSITION CONSTANTS (GUI Polish)
// ============================================================================
export const WALL_HEIGHT_RATIO = 0.7; // 70% back wall, 30% floor strip
export const FLOOR_STRIP_RATIO = 0.3;
export const OBJECT_SCALE_RATIO = 0.4; // Desks/Main objects ~40% of room width
export const AGENT_SCALE_RATIO = 0.7;  // Agent height relative to desk height

export type GridCoord = { col: number; row: number };

export function gridToPixel(col: number, row: number): { x: number; y: number } {
  return {
    x: col * CELL_WIDTH,
    y: row * CELL_HEIGHT
  };
}

export function gridToRect(gridPos: { col: number; row: number; w: number; h: number }) {
  return {
    x: gridPos.col * CELL_WIDTH,
    y: gridPos.row * CELL_HEIGHT,
    width: gridPos.w * CELL_WIDTH,
    height: gridPos.h * CELL_HEIGHT
  };
}

// ============================================================================
// ROOM GRID POSITIONS (col, row, width_in_cells, height_in_cells)
// ============================================================================
export const ROOM_GRID = {
  // ROW 0: Leadership / Thinking
  executive:   { col: 0, row: 0, w: 1, h: 1 },  // LeslieClaw
  sherlock:    { col: 1, row: 0, w: 1, h: 1 },  // Sherlock
  zeroClaw:    { col: 2, row: 0, w: 1, h: 1 },  // ZeroClaw
  conference:  { col: 3, row: 0, w: 1, h: 1 },
  kitchen:     { col: 4, row: 0, w: 1, h: 1 },

  // ROW 1: Operations
  lobby:       { col: 0, row: 1, w: 1, h: 1 },  // FrontDesk
  openOffice:  { col: 1, row: 1, w: 2, h: 1 },  // Shared
  warRoom:     { col: 3, row: 1, w: 1, h: 1 },  // Hercule
  archives:    { col: 4, row: 1, w: 1, h: 2 },  // HermitClaw (Tall)

  // ROW 2: Infrastructure
  gym:         { col: 0, row: 2, w: 1, h: 1 },
  sherlobster: { col: 1, row: 2, w: 1, h: 1 },  // Sherlobster
  missionCtrl: { col: 2, row: 2, w: 1, h: 1 },
  dataNodes:   { col: 3, row: 2, w: 1, h: 1 },  // IronClaw
};

// ============================================================================
// ROOM DEFINITIONS
// ============================================================================
export const ROOMS: Record<string, { x: number; y: number; width: number; height: number; label: string; zoneId: string }> = (() => {
  const r = ROOM_GRID;
  return {
    executive:   { ...gridToRect(r.executive), label: "Executive Suite", zoneId: "exec_suite" },
    sherlock:    { ...gridToRect(r.sherlock), label: "Sherlock Office", zoneId: "sherlock_office" },
    zeroClaw:    { ...gridToRect(r.zeroClaw), label: "ZeroClaw Sandbox", zoneId: "zeroclaw_sandbox" },
    conference:  { ...gridToRect(r.conference), label: "Conference Room", zoneId: "conference" },
    kitchen:     { ...gridToRect(r.kitchen), label: "Kitchen & Cooler", zoneId: "kitchen" },
    lobby:       { ...gridToRect(r.lobby), label: "Lobby & Reception", zoneId: "lobby" },
    openOffice:  { ...gridToRect(r.openOffice), label: "Open Office", zoneId: "open_office" },
    warRoom:     { ...gridToRect(r.warRoom), label: "War Room", zoneId: "war_room" },
    archives:    { ...gridToRect(r.archives), label: "Archives & Records", zoneId: "archives" },
    gym:         { ...gridToRect(r.gym), label: "Gym & Wellness", zoneId: "gym" },
    sherlobster: { ...gridToRect(r.sherlobster), label: "Strategy Room", zoneId: "sherlobster" },
    missionControl: { ...gridToRect(r.missionCtrl), label: "Mission Control", zoneId: "mission_control" },
    dataNodes:   { ...gridToRect(r.dataNodes), label: "Data Nodes", zoneId: "data_nodes" },
  };
})();

// ============================================================================
// AGENT / DESK POSITIONS
// ============================================================================
export const CUBICLE_WIDTH = 120;
export const CUBICLE_HEIGHT = 100;

export function getZoneAtPosition(x: number, y: number): string | null {
  for (const [zoneId, room] of Object.entries(ROOMS)) {
    if (x >= room.x && x <= room.x + room.width && y >= room.y && y <= room.y + room.height) {
      return zoneId;
    }
  }
  return null;
}

export function getZoneForAgent(agent: Agent): string {
  return getZoneAtPosition(agent.x, agent.y) || "unknown";
}

// Agent desk positions in pixels (unique positions per agent, aligned to grid rooms)
// Grounded: agent feet on floor line (room.y + room.height * 0.7)
// y offset of 14px accounts for agent drawing logic (feet are at y + 14)
export const CUBICLE_POSITIONS = [
  { x: 120, y: 394 },   // 0: Lobby - FrontDesk (row 1, floorY=408, 408-14=394)
  { x: 360, y: 394 },   // 1: OpenOffice L - OpenClaw
  { x: 840, y: 634 },   // 2: DataNodes - IronClaw (row 2, floorY=648, 648-14=634)
  { x: 1080, y: 394 },  // 3: Archives - HermitClaw (row 1, floorY=408)
  { x: 120, y: 154 },   // 4: Executive - LeslieClaw (row 0, floorY=168, 168-14=154)
  { x: 360, y: 154 },   // 5: Sherlock - Sherlock
  { x: 600, y: 154 },   // 6: ZeroClaw - ZeroClaw
  { x: 360, y: 634 },   // 7: Sherlobster - Sherlobster (row 2, floorY=648)
  { x: 840, y: 394 },   // 8: WarRoom - Hercule (row 1, floorY=408)
];

export const DESK_POSITIONS = CUBICLE_POSITIONS.map((pos) => ({
  x: pos.x - 60,
  y: pos.y + 14 - 50, // Desk sits on floor (floor line is pos.y + 14)
}));

export const CHAIR_POSITIONS = CUBICLE_POSITIONS.map((pos) => ({
  x: pos.x,
  y: pos.y,
}));

// ============================================================================
// WANDER POINTS (for idle agents)
// ============================================================================
export const WANDER_POINTS = [
  { x: 120, y: 394 },    // Lobby (row 1)
  { x: 360, y: 394 },    // Open Office
  { x: 1080, y: 154 },   // Kitchen (row 0)
  { x: 1080, y: 394 },   // Archives (row 1)
  { x: 120, y: 154 },    // Executive (row 0)
  { x: 840, y: 154 },    // Conference (row 0)
  { x: 120, y: 634 },    // Gym (row 2)
  { x: 600, y: 634 },    // Mission Ctrl (row 2)
];

export const ZONE_CONFIG: Record<string, { mood: string; intensity: "high" | "medium" | "low"; color: string }> = {
  lobby: { mood: "welcoming", intensity: "medium", color: "#1a2230" },
  kitchen: { mood: "casual", intensity: "low", color: "#1a1a22" },
  openOffice: { mood: "operational", intensity: "medium", color: "#0d1220" },
  archives: { mood: "reflective", intensity: "low", color: "#151a25" },
  executive: { mood: "strategic", intensity: "high", color: "#c0c0b8" },
  sherlock_office: { mood: "analytical", intensity: "high", color: "#e8e0d0" },
  zeroclaw_sandbox: { mood: "experimental", intensity: "high", color: "#1a2230" },
  warRoom: { mood: "intense", intensity: "high", color: "#1a1f28" },
  conference: { mood: "focused", intensity: "high", color: "#1a2230" },
  gym: { mood: "relaxed", intensity: "low", color: "#151a22" },
  sherlobster: { mood: "strategic", intensity: "high", color: "#e8dcc8" },
  missionControl: { mood: "intense", intensity: "high", color: "#151a22" },
  dataNodes: { mood: "operational", intensity: "medium", color: "#1a1a25" },
};

export const COLORS = {
  floorDark: "#050814",
  floorLight: "#0a1023",
  wall: "#1b2333",
  wallBorder: "#2a3548",
  desk: "#3d3225",
  deskTop: "#4a3d2e",
  monitorFrame: "#1a1a2e",
  monitorScreen: "#2f7fff",
  monitorScreenOff: "#1a1a2e",
  statusWorking: "#00ff88",
  statusIdle: "#ff4b4b",
  statusBarBg: "#050509",
  white: "#e8e8e8",
  couch: "#6b3a5b",
  couchAccent: "#8b4a6b",
  waterCooler: "#4a6b8a",
  waterTank: "#5a8bba",
  plantGreen: "#2d5a3d",
  plantTrunk: "#4a3020",
  bookshelf: "#5a4535",
  books: ["#8b4a6b", "#4a6b8a", "#6b5a4a", "#4a8b5a", "#8b6b4a"],
  fridge: "#d0d0d0",
  fridgeHandle: "#888888",
  coffeeMachine: "#2a2a2a",
  pingPongTable: "#2a5a3a",
  pingPongLine: "#ffffff",
  beanBag: "#5a4a6b",
  whiteboard: "#d8d8d8",
  whiteboardBorder: "#888888",
  indicatorGlow: "#00ff88",
  indicatorBusy: "#ffcc00",
  
  accentTeal: "#008080",
  accentSlateBlue: "#4a5568",
  accentNavy: "#1a365d",
  accentMutedGreen: "#6b7c6b",
  accentCream: "#f5f5dc",
  
  floorHardwoodLight: "#8b7355",
  floorHardwoodDark: "#6b5344",
  floorHardwoodWorn: "#9b8365",
  floorCharcoalCarpet: "#2d2d2d",
  floorHoneyHardwood: "#c4a35a",
  floorDarkHardwood: "#4a3728",
  floorLightOak: "#d4b896",
  
  concrete: "#6b6b6b",
  concreteLight: "#8a8a8a",
  
  rugCharcoal: "#3a3a3a",
  rugPersian: "#8b4513",
  rugPatterned: "#2a3a5a",
  
  lampWarm: "#ffd700",
  lampCool: "#e0e8ff",
  
  binderWorkflows: "#2e7d32",
  binderIncidents: "#c62828",
  binderGuests: "#1565c0",
  
  pencilCup: "#4a4a4a",
  penColors: ["#1a237e", "#0d47a1", "#01579b"],
  
  glassAshtray: "#4a6a7a",
  ceramicCup: "#d4a574",
  
  timelineStrip: "#3a2a1a",
};

export const ROLE_DESK_ITEMS: Record<string, string> = {
  receptionist: "bell",
  clerk: "clipboard",
  executive: "briefcase",
  specialist: "microscope",
  custodian: "wrench",
  archivist: "book",
};