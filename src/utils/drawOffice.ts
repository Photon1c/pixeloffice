import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  STATUS_BAR_HEIGHT,
  COLORS,
  ROOMS,
  ZONE_CONFIG,
} from "./layout";
import { OFFICE_LAYOUT, OfficeObject } from "./officeLayout";
import { AgentVisibility, ZoneActivity } from "../types";

// ============================================================================
// OBJECT DRAWING HELPERS
// ============================================================================

function drawObject(ctx: CanvasRenderingContext2D, obj: OfficeObject, roomX: number, roomY: number, floorY: number): void {
  const x = roomX + obj.x;
  const y = roomY + obj.y;
  const w = obj.width || 40;
  const h = obj.height || 40;

  ctx.save();
  
  if (obj.rotation) {
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(obj.rotation);
    ctx.translate(-(x + w / 2), -(y + h / 2));
  }

  switch (obj.type) {
    case "desk":
    case "table":
    case "counter":
    case "server_rack":
    case "fridge":
    case "bookshelf":
      // Grounded on floor: bottom of object = floorY
      const groundY = floorY - h;
      
      if (obj.type === "fridge") {
        ctx.fillStyle = "#d0d0d0";
        ctx.fillRect(x, groundY, w, h);
        ctx.fillStyle = "#888";
        ctx.fillRect(x + w - 8, groundY + h / 2 - 10, 4, 20);
      } else if (obj.type === "counter") {
        ctx.fillStyle = "#2a2a2a";
        ctx.fillRect(x, groundY, w, h);
        ctx.fillStyle = "#444";
        ctx.fillRect(x, groundY, w, 4);
      } else if (obj.type === "server_rack") {
        ctx.fillStyle = "#1a1a1a";
        ctx.fillRect(x, groundY, w, h);
        ctx.strokeStyle = "#333";
        ctx.strokeRect(x, groundY, w, h);
      } else if (obj.type === "bookshelf") {
        ctx.fillStyle = COLORS.bookshelf;
        ctx.fillRect(x, groundY, w, h);
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = COLORS.books[i % COLORS.books.length];
          ctx.fillRect(x + 4 + i * (w / 4), groundY + 5, w / 5, h / 2);
        }
      } else {
        ctx.fillStyle = COLORS.desk;
        if (obj.spriteId === "table_oval") {
          ctx.beginPath();
          ctx.ellipse(x + w / 2, groundY + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(x, groundY, w, h);
          ctx.fillStyle = COLORS.deskTop;
          ctx.fillRect(x, groundY, w, 6);
        }
      }
      
      if (obj.label) {
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "7px 'JetBrains Mono'";
        ctx.fillText(obj.label, x + 5, groundY + h - 5);
      }
      break;

    case "rug":
    case "mat":
      // Rugs sit on the floor strip area
      ctx.fillStyle = obj.spriteId === "rug_persian" ? COLORS.rugPersian : (obj.type === "mat" ? "#2a4a6a" : COLORS.rugCharcoal);
      ctx.globalAlpha = 0.4;
      ctx.fillRect(x, floorY, w, roomY + ROOMS[obj.roomId].height - floorY - 5);
      ctx.globalAlpha = 1.0;
      break;

    case "water_cooler":
      const coolerY = floorY - h;
      ctx.fillStyle = COLORS.waterCooler;
      ctx.fillRect(x, coolerY + h / 2, w, h / 2); // Base
      ctx.fillStyle = COLORS.waterTank;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(x + w / 2, coolerY + h / 4, w / 2, 0, Math.PI * 2); // Tank
      ctx.fill();
      ctx.globalAlpha = 1.0;
      break;

    case "pull_up_bar":
      ctx.fillStyle = "#333";
      // Horizontal bar
      ctx.fillRect(x, y + h / 2 - 2, w, 4);
      // Brackets
      ctx.fillRect(x + 10, y, 4, h);
      ctx.fillRect(x + w - 14, y, 4, h);
      break;

    case "monitor":
      // Monitors sit on surfaces (y relative to room)
      ctx.fillStyle = COLORS.monitorFrame;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = COLORS.monitorScreen;
      ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
      break;

    case "accessory":
      if (obj.spriteId === "coffee_machine") {
        ctx.fillStyle = "#333";
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = "#00ff88";
        ctx.fillRect(x + w - 8, y + 5, 4, 4);
      } else if (obj.spriteId === "carafe") {
        ctx.fillStyle = "rgba(150, 200, 255, 0.6)";
        ctx.fillRect(x, y, w, h);
      } else if (obj.spriteId === "dumbbells") {
        ctx.fillStyle = "#444";
        // Left head
        ctx.fillRect(x, y, 6, h);
        // Bar
        ctx.fillRect(x + 6, y + h / 2 - 2, w - 12, 4);
        // Right head
        ctx.fillRect(x + w - 6, y, 6, h);
      }
      break;

    case "plant":
      drawPlant(ctx, x, floorY - 30);
      break;

    case "lamp":
      ctx.fillStyle = "#333";
      ctx.fillRect(x + w / 2 - 1, floorY - h, 2, h);
      ctx.fillStyle = COLORS.lampWarm;
      ctx.globalAlpha = 0.2;
      ctx.beginPath();
      ctx.arc(x + w / 2, floorY - h, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
      break;

    case "whiteboard":
      ctx.fillStyle = "#fff";
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = "#888";
      ctx.strokeRect(x, y, w, h);
      break;

    case "painting":
      ctx.fillStyle = "#f0f0f0";
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = "#333";
      ctx.strokeRect(x, y, w, h);
      break;

    default:
      ctx.fillStyle = "rgba(100,100,100,0.5)";
      ctx.fillRect(x, y, w, h);
      break;
  }

  ctx.restore();
}

function drawRoomObjects(ctx: CanvasRenderingContext2D, roomId: string): void {
  const room = ROOMS[roomId];
  if (!room) return;

  const floorY = room.y + room.height * 0.7;
  const objects = OFFICE_LAYOUT.objects.filter(obj => obj.roomId === roomId);
  objects.forEach(obj => {
    drawObject(ctx, obj, room.x, room.y, floorY);
  });
}

// ============================================================================
// ROOM DRAWING EXPORTS
// ============================================================================

export function drawPlants(ctx: CanvasRenderingContext2D): void {
  // Previously this drew a clock, now it's a placeholder for room props
}

export function drawFloor(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = "#050814";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT - STATUS_BAR_HEIGHT);
  
  Object.values(ROOMS).forEach(room => {
    const wallHeight = room.height * 0.7;
    const config = ZONE_CONFIG[room.zoneId];
    
    // Back Wall - Use room specific color if available
    ctx.fillStyle = config?.color || "#0a1023";
    ctx.fillRect(room.x, room.y, room.width, wallHeight);
    
    // Floor Strip
    ctx.fillStyle = "#080c18";
    ctx.fillRect(room.x, room.y + wallHeight, room.width, room.height - wallHeight);
    
    // Floor anchor line
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(room.x, room.y + wallHeight);
    ctx.lineTo(room.x + room.width, room.y + wallHeight);
    ctx.stroke();
  });
}

export function drawWalls(ctx: CanvasRenderingContext2D): void {
  ctx.lineWidth = 2;

  Object.values(ROOMS).forEach(room => {
    // Outer boundary
    ctx.strokeStyle = "#2a3548";
    ctx.strokeRect(room.x, room.y, room.width, room.height);
    
    // Room Header
    ctx.fillStyle = "rgba(27, 35, 51, 0.8)";
    ctx.fillRect(room.x + 2, room.y + 2, room.width - 4, 18);
    
    ctx.fillStyle = "#4a5a6a";
    ctx.font = "bold 9px 'JetBrains Mono', monospace";
    ctx.fillText(room.label.toUpperCase(), room.x + 8, room.y + 14);
  });
}

export function drawZoneIndicators(ctx: CanvasRenderingContext2D, zoneActivity: Map<string, ZoneActivity>, traces: any[] = []): void {
  Object.values(ROOMS).forEach(room => {
    const activity = zoneActivity.get(room.zoneId);
    
    // 1. Draw conversation activity indicator
    if (activity && activity.conversationActive) {
      const centerX = room.x + room.width / 2;
      const centerY = room.y + room.height / 2;
      ctx.save();
      ctx.globalAlpha = 0.3 + 0.2 * Math.sin(Date.now() / 300);
      ctx.fillStyle = ZONE_CONFIG[room.zoneId]?.color || "#4a5a6a";
      ctx.beginPath(); ctx.arc(centerX, centerY, 30, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // 2. Draw STIGMERGY TRACES
    const roomTraces = traces.filter(t => t.roomId === room.zoneId);
    roomTraces.forEach(t => {
      const centerX = room.x + room.width / 2;
      const centerY = room.y + room.height * 0.7;

      if (t.type === "review_heat") {
        ctx.save();
        const pulse = Math.sin(Date.now() / 400) * 0.5 + 0.5;
        const glowSize = 40 + (t.intensity * 40) + (pulse * 10);
        const gradient = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, glowSize);
        gradient.addColorStop(0, `rgba(255, 100, 50, ${0.4 * t.intensity})`);
        gradient.addColorStop(1, "rgba(255, 100, 50, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath(); ctx.arc(centerX, centerY, glowSize, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      } else if (t.type === "task_shadow") {
        // Draw "ghost footprints" or shadow at the desk
        ctx.save();
        ctx.globalAlpha = t.intensity * 0.5;
        ctx.fillStyle = "rgba(100, 100, 255, 0.3)";
        // Footprint dots
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.ellipse(centerX - 10 + i * 10, centerY + 5 + (i % 2 === 0 ? 5 : -5), 4, 6, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    });
  });
}

export function drawMissionControl(ctx: CanvasRenderingContext2D): void {
  drawRoomObjects(ctx, "missionControl");
}

export function drawLobby(ctx: CanvasRenderingContext2D): void {
  drawRoomObjects(ctx, "lobby");
}

export function drawWarRoom(ctx: CanvasRenderingContext2D): void {
  drawRoomObjects(ctx, "warRoom");
}

export function drawSherlobsterRoom(ctx: CanvasRenderingContext2D): void {
  drawRoomObjects(ctx, "sherlobster");
}

export function drawArchives(ctx: CanvasRenderingContext2D): void {
  drawRoomObjects(ctx, "archives");
}

export function drawSpecialistSuite(ctx: CanvasRenderingContext2D): void {
  drawRoomObjects(ctx, "zeroClaw");
}

export function drawConferenceRoom(ctx: CanvasRenderingContext2D): void {
  drawRoomObjects(ctx, "conference");
}

export function drawExecutiveSuite(ctx: CanvasRenderingContext2D, visibility?: AgentVisibility): void {
  const room = ROOMS.executive;
  drawRoomObjects(ctx, "executive");
  drawSherlockDoor(ctx, room, visibility);
}

export const drawBossOffice = drawExecutiveSuite;

function drawSherlockDoor(ctx: CanvasRenderingContext2D, room: any, visibility?: AgentVisibility): void {
  const floorLine = room.y + room.height * 0.7;
  const doorX = room.x + room.width - 30;
  const doorY = floorLine - 35; // Sit on floor line
  ctx.fillStyle = visibility === "offline" ? "#1a1a1a" : visibility === "private" ? "#2a1a2a" : "#3a2a1a";
  ctx.fillRect(doorX, doorY, 20, 35);
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.strokeRect(doorX, doorY, 20, 35);
}

export function drawSherlockOffice(ctx: CanvasRenderingContext2D): void {
  drawRoomObjects(ctx, "sherlock");
}

export function drawKitchen(ctx: CanvasRenderingContext2D): void {
  drawRoomObjects(ctx, "kitchen");
}

export function drawCubicles(ctx: CanvasRenderingContext2D): void {
  drawRoomObjects(ctx, "openOffice");
}

export function drawDataNodes(ctx: CanvasRenderingContext2D): void {
  drawRoomObjects(ctx, "dataNodes");
}

export function drawGym(ctx: CanvasRenderingContext2D): void {
  drawRoomObjects(ctx, "gym");
}

export const drawLounge = drawGym;

export function drawPlant(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  // Pot
  ctx.fillStyle = "#3a2a1a";
  ctx.fillRect(x + 6, y + 15, 12, 15);
  ctx.fillStyle = "#4a3a2a";
  ctx.fillRect(x + 4, y + 12, 16, 4);

  // Stem
  ctx.fillStyle = "#1a3a1a";
  ctx.fillRect(x + 11, y, 2, 12);

  // Leaves
  ctx.fillStyle = "#1a4a2a";
  ctx.beginPath();
  ctx.ellipse(x + 12, y + 2, 8, 5, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 12, y + 8, 10, 6, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function drawStatusBar(ctx: CanvasRenderingContext2D, agents: any[], shouldRespectPrivacy: boolean = true, periodLabel?: string): void {
  const barY = CANVAS_HEIGHT - STATUS_BAR_HEIGHT;
  ctx.fillStyle = COLORS.statusBarBg;
  ctx.fillRect(0, barY, CANVAS_WIDTH, STATUS_BAR_HEIGHT);
  
  ctx.strokeStyle = COLORS.wallBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(0, barY, CANVAS_WIDTH, STATUS_BAR_HEIGHT);

  // Period label
  if (periodLabel) {
    ctx.fillStyle = "rgba(78, 205, 196, 0.8)";
    ctx.font = "bold 11px 'JetBrains Mono', monospace";
    ctx.fillText(`CURRENT STATUS: ${periodLabel.toUpperCase()}`, 20, barY + 55);
  }

  const agentWidth = 120;
  const startX = (CANVAS_WIDTH - agents.length * agentWidth) / 2;

  agents.forEach((agent, index) => {
    const x = startX + index * agentWidth + 5;
    const y = barY + 15;

    const isOffline = shouldRespectPrivacy && agent.visibility === "offline";
    ctx.fillStyle = isOffline ? "#444444" : agent.color;
    ctx.beginPath();
    ctx.arc(x + 10, y + 10, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = COLORS.white;
    ctx.font = "600 10px 'JetBrains Mono', monospace";
    ctx.fillText(agent.name, x + 20, y + 14);
  });
}