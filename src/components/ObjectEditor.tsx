import { useState, useCallback, useRef, useEffect } from "react";
import { COLORS } from "../utils/layout";
import { OFFICE_LAYOUT } from "../utils/officeLayout";

export type RoomId = string;
export type ObjectId = string;

export type OfficeObjectDraft = {
  id: ObjectId;
  roomId: RoomId;
  type: string;
  spriteId: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  zIndex?: number;
  label?: string;
};

export type OfficeLayoutDraft = {
  objects: OfficeObjectDraft[];
};

const AVAILABLE_TYPES = [
  { value: "desk", label: "Desk" },
  { value: "table", label: "Table" },
  { value: "chair", label: "Chair" },
  { value: "monitor", label: "Monitor" },
  { value: "rug", label: "Rug" },
  { value: "mat", label: "Mat" },
  { value: "plant", label: "Plant" },
  { value: "lamp", label: "Lamp" },
  { value: "whiteboard", label: "Whiteboard" },
  { value: "bookshelf", label: "Bookshelf" },
  { value: "counter", label: "Counter" },
  { value: "fridge", label: "Fridge" },
  { value: "server_rack", label: "Server Rack" },
  { value: "painting", label: "Painting" },
  { value: "accessory", label: "Accessory" },
  { value: "water_cooler", label: "Water Cooler" },
  { value: "pull_up_bar", label: "Pull Up Bar" },
];

const AVAILABLE_ROOMS = [
  { value: "executive", label: "Executive Suite" },
  { value: "sherlock", label: "Sherlock Office" },
  { value: "zeroClaw", label: "ZeroClaw Sandbox" },
  { value: "conference", label: "Conference Room" },
  { value: "kitchen", label: "Kitchen" },
  { value: "lobby", label: "Lobby" },
  { value: "openOffice", label: "Open Office" },
  { value: "warRoom", label: "War Room" },
  { value: "archives", label: "Archives" },
  { value: "gym", label: "Gym" },
  { value: "sherlobster", label: "Strategy Room" },
  { value: "missionControl", label: "Mission Control" },
  { value: "dataNodes", label: "Data Nodes" },
];

const OBJECT_COLORS: Record<string, string> = {
  desk: "#8b6914",
  table: "#6b4423",
  chair: "#4a3520",
  monitor: "#2a3a5a",
  rug: "#5a3a6a",
  mat: "#2a4a6a",
  plant: "#2d5a3d",
  lamp: "#ffd700",
  whiteboard: "#e8e8e8",
  bookshelf: "#5a4535",
  counter: "#2a2a2a",
  fridge: "#d0d0d0",
  server_rack: "#1a1a1a",
  painting: "#f0f0f0",
  accessory: "#888888",
  water_cooler: "#4a6b8a",
  pull_up_bar: "#333333",
};

const ROOM_WIDTH = 240;
const ROOM_HEIGHT = 240;
const CANVAS_SCALE = 1.5;

interface DragState {
  objectId: string;
  startX: number;
  startY: number;
  startObjX: number;
  startObjY: number;
  mode: "move" | "resize";
  resizeEdge?: "se" | "e" | "s";
}

interface ObjectEditorProps {
  onClose: () => void;
  initialRoom?: RoomId;
  onSave?: (layout: OfficeLayoutDraft) => void;
}

export default function ObjectEditor({ onClose, initialRoom, onSave }: ObjectEditorProps) {
  const [objects, setObjects] = useState<OfficeObjectDraft[]>(
    OFFICE_LAYOUT.objects.map(obj => ({ ...obj }))
  );
  const [selectedRoom, setSelectedRoom] = useState<RoomId>(initialRoom || "conference");
  const [selectedObjectId, setSelectedObjectId] = useState<ObjectId | null>(null);
  const [editingObject, setEditingObject] = useState<OfficeObjectDraft | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [newObject, setNewObject] = useState<Partial<OfficeObjectDraft>>({
    roomId: initialRoom || "conference",
    type: "desk",
    spriteId: "desk_wood",
    x: 50,
    y: 50,
    width: 80,
    height: 40,
  });

  const roomObjects = objects.filter(obj => obj.roomId === selectedRoom);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.scale(CANVAS_SCALE, CANVAS_SCALE);

    ctx.fillStyle = "#0d1220";
    ctx.fillRect(0, 0, ROOM_WIDTH, ROOM_HEIGHT);

    const wallHeight = ROOM_HEIGHT * 0.7;
    ctx.fillStyle = "#1a2230";
    ctx.fillRect(0, 0, ROOM_WIDTH, wallHeight);

    ctx.fillStyle = "#080c18";
    ctx.fillRect(0, wallHeight, ROOM_WIDTH, ROOM_HEIGHT - wallHeight);

    ctx.strokeStyle = "#2a3548";
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, ROOM_WIDTH - 1, ROOM_HEIGHT - 1);
    ctx.beginPath();
    ctx.moveTo(0.5, wallHeight);
    ctx.lineTo(ROOM_WIDTH - 0.5, wallHeight);
    ctx.stroke();

    roomObjects.forEach(obj => {
      const x = obj.x;
      const y = obj.y;
      const w = obj.width || 40;
      const h = obj.height || 40;
      const isSelected = selectedObjectId === obj.id;
      const color = OBJECT_COLORS[obj.type] || "#888888";

      ctx.save();
      if (obj.rotation) {
        const cx = x + w / 2;
        const cy = y + h / 2;
        ctx.translate(cx, cy);
        ctx.rotate((obj.rotation * Math.PI) / 180);
        ctx.translate(-cx, -cy);
      }

      if (obj.type === "rug" || obj.type === "mat") {
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.5;
        ctx.fillRect(x, wallHeight - 5, w, h);
        ctx.globalAlpha = 1;
      } else if (obj.type === "table" && obj.spriteId?.includes("oval")) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
      }

      if (isSelected) {
        ctx.strokeStyle = "#4ecdc4";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 2]);
        ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
        ctx.setLineDash([]);

        ctx.fillStyle = "#4ecdc4";
        ctx.fillRect(x + w - 6, y + h - 6, 10, 10);
        ctx.fillStyle = "#0a0a12";
        ctx.fillRect(x + w - 4, y + h - 4, 6, 6);

        ctx.fillStyle = "#4ecdc4";
        ctx.fillRect(x + w - 2, y + h / 2 - 3, 6, 6);
        ctx.fillStyle = "#0a0a12";
        ctx.fillRect(x + w, y + h / 2 - 1, 2, 2);

        ctx.fillStyle = "#4ecdc4";
        ctx.fillRect(x + w / 2 - 3, y + h - 2, 6, 6);
        ctx.fillStyle = "#0a0a12";
        ctx.fillRect(x + w / 2 - 1, y + h, 2, 2);
      }

      if (obj.label) {
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.font = "8px JetBrains Mono, monospace";
        ctx.fillText(obj.label, x + 4, y + h + 12);
      }

      ctx.restore();
    });

    ctx.restore();
  }, [roomObjects, selectedObjectId]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / CANVAS_SCALE;
    const mouseY = (e.clientY - rect.top) / CANVAS_SCALE;

    for (let i = roomObjects.length - 1; i >= 0; i--) {
      const obj = roomObjects[i];
      const x = obj.x;
      const y = obj.y;
      const w = obj.width || 40;
      const h = obj.height || 40;

      if (mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h) {
        if (mouseX >= x + w - 10 && mouseX <= x + w && mouseY >= y + h - 10 && mouseY <= y + h) {
          setDragState({
            objectId: obj.id,
            startX: mouseX,
            startY: mouseY,
            startObjX: obj.x,
            startObjY: obj.y,
            mode: "resize",
            resizeEdge: "se",
          });
        } else if (mouseX >= x + w - 6 && mouseX <= x + w && mouseY >= y + h / 2 - 3 && mouseY <= y + h / 2 + 3) {
          setDragState({
            objectId: obj.id,
            startX: mouseX,
            startY: mouseY,
            startObjX: obj.x,
            startObjY: obj.y,
            mode: "resize",
            resizeEdge: "e",
          });
        } else if (mouseY >= y + h - 6 && mouseY <= y + h && mouseX >= x + w / 2 - 3 && mouseX <= x + w / 2 + 3) {
          setDragState({
            objectId: obj.id,
            startX: mouseX,
            startY: mouseY,
            startObjX: obj.x,
            startObjY: obj.y,
            mode: "resize",
            resizeEdge: "s",
          });
        } else {
          setDragState({
            objectId: obj.id,
            startX: mouseX,
            startY: mouseY,
            startObjX: obj.x,
            startObjY: obj.y,
            mode: "move",
          });
        }

        setSelectedObjectId(obj.id);
        setEditingObject({ ...obj });
        return;
      }
    }

    setSelectedObjectId(null);
    setEditingObject(null);
  }, [roomObjects]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragState) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / CANVAS_SCALE;
    const mouseY = (e.clientY - rect.top) / CANVAS_SCALE;

    const SENSITIVITY = 0.5;
    const deltaX = (mouseX - dragState.startX) * SENSITIVITY;
    const deltaY = (mouseY - dragState.startY) * SENSITIVITY;

    setObjects(prev => prev.map(obj => {
      if (obj.id !== dragState.objectId) return obj;

      if (dragState.mode === "move") {
        const newX = Math.max(0, Math.min(ROOM_WIDTH - (obj.width || 40), dragState.startObjX + deltaX));
        const newY = Math.max(0, Math.min(ROOM_HEIGHT - (obj.height || 40), dragState.startObjY + deltaY));
        return { ...obj, x: Math.round(newX), y: Math.round(newY) };
      } else if (dragState.mode === "resize") {
        const newWidth = Math.max(20, (obj.width || 40) + deltaX);
        const newHeight = Math.max(20, (obj.height || 40) + deltaY);
        return {
          ...obj,
          width: Math.round(newWidth),
          height: Math.round(newHeight),
        };
      }
      return obj;
    }));
  }, [dragState]);

  const handleCanvasMouseUp = useCallback(() => {
    setDragState(null);
  }, []);

  const handleSelectObject = useCallback((obj: OfficeObjectDraft) => {
    setSelectedObjectId(obj.id);
    setEditingObject({ ...obj });
  }, []);

  const handleUpdateObject = useCallback((field: keyof OfficeObjectDraft, value: any) => {
    if (!editingObject) return;
    const updated = { ...editingObject, [field]: value };
    setEditingObject(updated);
    setObjects(prev => prev.map(obj => obj.id === editingObject.id ? updated : obj));
  }, [editingObject]);

  const handleSaveObject = useCallback(() => {
    if (!editingObject) return;
    setObjects(prev => prev.map(obj => obj.id === editingObject.id ? editingObject : obj));
    setSelectedObjectId(null);
    setEditingObject(null);
  }, [editingObject]);

  const handleDeleteObject = useCallback((objectId: ObjectId) => {
    setObjects(prev => prev.filter(obj => obj.id !== objectId));
    if (selectedObjectId === objectId) {
      setSelectedObjectId(null);
      setEditingObject(null);
    }
  }, [selectedObjectId]);

  const handleAddObject = useCallback(() => {
    const id = `obj_${Date.now()}`;
    const obj: OfficeObjectDraft = {
      id,
      roomId: newObject.roomId || selectedRoom,
      type: newObject.type || "desk",
      spriteId: newObject.spriteId || "desk_wood",
      x: newObject.x || 50,
      y: newObject.y || 50,
      width: newObject.width,
      height: newObject.height,
      rotation: newObject.rotation,
      label: newObject.label,
    };
    setObjects(prev => [...prev, obj]);
    setShowAddForm(false);
    setNewObject({
      roomId: selectedRoom,
      type: "desk",
      spriteId: "desk_wood",
      x: 50,
      y: 50,
    });
    setSelectedObjectId(id);
    setEditingObject(obj);
  }, [newObject, selectedRoom]);

  const handleExport = useCallback(() => {
    const layout: OfficeLayoutDraft = { objects };
    if (onSave) {
      onSave(layout);
    } else {
      const json = JSON.stringify(layout, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "office_layout.json";
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [objects, onSave]);

  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const layout = JSON.parse(content) as OfficeLayoutDraft;
        if (layout.objects) {
          setObjects(layout.objects);
        }
      } catch (err) {
        console.error("Failed to parse layout file:", err);
      }
    };
    reader.readAsText(file);
  }, []);

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.container} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Object Editor</h2>
          <div style={styles.headerActions}>
            <label style={styles.importBtn}>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                style={{ display: "none" }}
              />
              Import
            </label>
            <button style={styles.exportBtn} onClick={handleExport}>
              Export JSON
            </button>
            <button style={styles.closeBtn} onClick={onClose}>×</button>
          </div>
        </div>

        <div style={styles.content}>
          <div style={styles.leftPanel}>
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Select Room</h3>
              <select
                style={styles.select}
                value={selectedRoom}
                onChange={e => {
                  setSelectedRoom(e.target.value as RoomId);
                  setSelectedObjectId(null);
                  setEditingObject(null);
                }}
              >
                {AVAILABLE_ROOMS.map(room => (
                  <option key={room.value} value={room.value}>{room.label}</option>
                ))}
              </select>
            </div>

            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>Objects ({roomObjects.length})</h3>
                <button
                  style={styles.addBtn}
                  onClick={() => {
                    setNewObject(prev => ({ ...prev, roomId: selectedRoom }));
                    setShowAddForm(true);
                  }}
                >
                  + Add
                </button>
              </div>
              
              <div style={styles.objectList}>
                {roomObjects.length === 0 && (
                  <div style={styles.emptyState}>No objects in this room</div>
                )}
                {roomObjects.map(obj => (
                  <div
                    key={obj.id}
                    style={{
                      ...styles.objectItem,
                      ...(selectedObjectId === obj.id ? styles.objectItemSelected : {}),
                    }}
                    onClick={() => handleSelectObject(obj)}
                  >
                    <span style={styles.objectType}>{obj.type}</span>
                    <span style={styles.objectSprite}>{obj.spriteId}</span>
                    <button
                      style={styles.deleteBtn}
                      onClick={e => {
                        e.stopPropagation();
                        handleDeleteObject(obj.id);
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {showAddForm && (
              <div style={styles.addForm}>
                <h4 style={styles.addFormTitle}>Add New Object</h4>
                <div style={styles.formGrid}>
                  <label style={styles.formLabel}>Type</label>
                  <select
                    style={styles.formInput}
                    value={newObject.type}
                    onChange={e => setNewObject(prev => ({ ...prev, type: e.target.value }))}
                  >
                    {AVAILABLE_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>

                  <label style={styles.formLabel}>Sprite ID</label>
                  <input
                    style={styles.formInput}
                    value={newObject.spriteId}
                    onChange={e => setNewObject(prev => ({ ...prev, spriteId: e.target.value }))}
                    placeholder="e.g., desk_wood"
                  />

                  <label style={styles.formLabel}>X</label>
                  <input
                    style={styles.formInput}
                    type="number"
                    value={newObject.x}
                    onChange={e => setNewObject(prev => ({ ...prev, x: Number(e.target.value) }))}
                  />

                  <label style={styles.formLabel}>Y</label>
                  <input
                    style={styles.formInput}
                    type="number"
                    value={newObject.y}
                    onChange={e => setNewObject(prev => ({ ...prev, y: Number(e.target.value) }))}
                  />

                  <label style={styles.formLabel}>Width</label>
                  <input
                    style={styles.formInput}
                    type="number"
                    value={newObject.width || ""}
                    onChange={e => setNewObject(prev => ({ ...prev, width: Number(e.target.value) || undefined }))}
                    placeholder="optional"
                  />

                  <label style={styles.formLabel}>Height</label>
                  <input
                    style={styles.formInput}
                    type="number"
                    value={newObject.height || ""}
                    onChange={e => setNewObject(prev => ({ ...prev, height: Number(e.target.value) || undefined }))}
                    placeholder="optional"
                  />

                  <label style={styles.formLabel}>Label</label>
                  <input
                    style={styles.formInput}
                    value={newObject.label || ""}
                    onChange={e => setNewObject(prev => ({ ...prev, label: e.target.value || undefined }))}
                    placeholder="optional"
                  />
                </div>
                <div style={styles.formActions}>
                  <button style={styles.cancelBtn} onClick={() => setShowAddForm(false)}>
                    Cancel
                  </button>
                  <button style={styles.confirmBtn} onClick={handleAddObject}>
                    Add Object
                  </button>
                </div>
              </div>
            )}
          </div>

          <div style={styles.centerPanel}>
            <div style={styles.canvasSection}>
              <h3 style={styles.sectionTitle}>Canvas Preview</h3>
              <p style={styles.canvasHint}>Click and drag to move • Corner handle to resize</p>
              <div style={styles.canvasWrapper} ref={containerRef}>
                <canvas
                  ref={canvasRef}
                  width={ROOM_WIDTH * CANVAS_SCALE}
                  height={ROOM_HEIGHT * CANVAS_SCALE}
                  style={styles.canvas}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                />
              </div>
            </div>
          </div>

          <div style={styles.rightPanel}>
            {editingObject ? (
              <div style={styles.editor}>
                <h3 style={styles.editorTitle}>
                  Edit: {editingObject.type}
                  <span style={styles.editorId}>#{editingObject.id}</span>
                </h3>

                <div style={styles.formGrid}>
                  <label style={styles.formLabel}>Type</label>
                  <select
                    style={styles.formInput}
                    value={editingObject.type}
                    onChange={e => handleUpdateObject("type", e.target.value)}
                  >
                    {AVAILABLE_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>

                  <label style={styles.formLabel}>Sprite ID</label>
                  <input
                    style={styles.formInput}
                    value={editingObject.spriteId}
                    onChange={e => handleUpdateObject("spriteId", e.target.value)}
                  />

                  <label style={styles.formLabel}>X Position</label>
                  <input
                    style={styles.formInput}
                    type="number"
                    value={editingObject.x}
                    onChange={e => handleUpdateObject("x", Number(e.target.value))}
                  />

                  <label style={styles.formLabel}>Y Position</label>
                  <input
                    style={styles.formInput}
                    type="number"
                    value={editingObject.y}
                    onChange={e => handleUpdateObject("y", Number(e.target.value))}
                  />

                  <label style={styles.formLabel}>Width</label>
                  <input
                    style={styles.formInput}
                    type="number"
                    value={editingObject.width || ""}
                    onChange={e => handleUpdateObject("width", Number(e.target.value) || undefined)}
                    placeholder="auto"
                  />

                  <label style={styles.formLabel}>Height</label>
                  <input
                    style={styles.formInput}
                    type="number"
                    value={editingObject.height || ""}
                    onChange={e => handleUpdateObject("height", Number(e.target.value) || undefined)}
                    placeholder="auto"
                  />

                  <label style={styles.formLabel}>Rotation (deg)</label>
                  <input
                    style={styles.formInput}
                    type="number"
                    value={editingObject.rotation || 0}
                    onChange={e => handleUpdateObject("rotation", Number(e.target.value) || 0)}
                  />

                  <label style={styles.formLabel}>Z-Index</label>
                  <input
                    style={styles.formInput}
                    type="number"
                    value={editingObject.zIndex || ""}
                    onChange={e => handleUpdateObject("zIndex", Number(e.target.value) || undefined)}
                    placeholder="auto"
                  />

                  <label style={styles.formLabel}>Label</label>
                  <input
                    style={styles.formInput}
                    value={editingObject.label || ""}
                    onChange={e => handleUpdateObject("label", e.target.value || undefined)}
                    placeholder="optional"
                  />
                </div>

                <div style={styles.editorActions}>
                  <button
                    style={styles.deleteObjectBtn}
                    onClick={() => handleDeleteObject(editingObject.id)}
                  >
                    Delete Object
                  </button>
                  <button
                    style={styles.saveBtn}
                    onClick={handleSaveObject}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div style={styles.noSelection}>
                <div style={styles.noSelectionIcon}>🎨</div>
                <p>Select an object from the list or canvas</p>
                <p style={styles.hint}>Click to select, drag to move, corner to resize</p>
              </div>
            )}
          </div>
        </div>

        <div style={styles.footer}>
          <span style={styles.footerInfo}>
            Total Objects: {objects.length} | Room: {AVAILABLE_ROOMS.find(r => r.value === selectedRoom)?.label}
          </span>
          <span style={styles.footerHint}>
            Changes are live on canvas • Export JSON to save
          </span>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.85)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2000,
  },
  container: {
    background: "#0a0a12",
    border: `1px solid ${COLORS.wallBorder}`,
    borderRadius: "12px",
    width: "1100px",
    maxWidth: "95vw",
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    borderBottom: `1px solid ${COLORS.wallBorder}`,
    background: "#050510",
  },
  title: {
    margin: 0,
    color: COLORS.white,
    fontSize: "18px",
    fontWeight: 600,
  },
  headerActions: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  importBtn: {
    padding: "8px 16px",
    background: "transparent",
    border: `1px solid ${COLORS.wallBorder}`,
    borderRadius: "6px",
    color: "#a0a0b0",
    fontSize: "12px",
    cursor: "pointer",
  },
  exportBtn: {
    padding: "8px 16px",
    background: "#1a2a3a",
    border: `1px solid ${COLORS.wallBorder}`,
    borderRadius: "6px",
    color: "#4ecdc4",
    fontSize: "12px",
    cursor: "pointer",
  },
  closeBtn: {
    width: "32px",
    height: "32px",
    background: "transparent",
    border: "none",
    color: "#707080",
    fontSize: "24px",
    cursor: "pointer",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  },
  leftPanel: {
    width: "260px",
    borderRight: `1px solid ${COLORS.wallBorder}`,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  centerPanel: {
    width: "420px",
    display: "flex",
    flexDirection: "column",
    borderRight: `1px solid ${COLORS.wallBorder}`,
  },
  section: {
    padding: "16px",
    borderBottom: `1px solid ${COLORS.wallBorder}`,
  },
  canvasSection: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    flex: 1,
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  sectionTitle: {
    margin: "0 0 8px 0",
    color: "#4ecdc4",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "1px",
    fontWeight: 600,
  },
  canvasHint: {
    margin: "0 0 12px 0",
    color: "#606070",
    fontSize: "10px",
  },
  select: {
    width: "100%",
    padding: "10px 12px",
    background: "#050509",
    border: `1px solid ${COLORS.wallBorder}`,
    borderRadius: "6px",
    color: COLORS.white,
    fontSize: "13px",
    cursor: "pointer",
    fontFamily: "'JetBrains Mono', monospace",
  },
  addBtn: {
    padding: "6px 12px",
    background: "#1a3a3a",
    border: "1px solid #4ecdc4",
    borderRadius: "4px",
    color: "#4ecdc4",
    fontSize: "11px",
    cursor: "pointer",
  },
  objectList: {
    maxHeight: "200px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  objectItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 12px",
    background: "#1a1a2a",
    border: `1px solid transparent`,
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  objectItemSelected: {
    background: "#1a2a3a",
    border: `1px solid #4ecdc4`,
  },
  objectType: {
    color: COLORS.white,
    fontSize: "12px",
    fontWeight: 500,
  },
  objectSprite: {
    color: "#707080",
    fontSize: "10px",
    fontFamily: "'JetBrains Mono', monospace",
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  deleteBtn: {
    width: "20px",
    height: "20px",
    background: "transparent",
    border: "none",
    color: "#ff4b4b",
    fontSize: "16px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.6,
  },
  emptyState: {
    color: "#505060",
    fontSize: "12px",
    textAlign: "center",
    padding: "20px",
  },
  addForm: {
    padding: "16px",
    background: "#0f1520",
    borderTop: `1px solid ${COLORS.wallBorder}`,
  },
  addFormTitle: {
    margin: "0 0 12px 0",
    color: COLORS.white,
    fontSize: "13px",
    fontWeight: 500,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "80px 1fr",
    gap: "8px",
    alignItems: "center",
  },
  formLabel: {
    color: "#707080",
    fontSize: "11px",
  },
  formInput: {
    padding: "8px 10px",
    background: "#050509",
    border: `1px solid ${COLORS.wallBorder}`,
    borderRadius: "4px",
    color: COLORS.white,
    fontSize: "12px",
    fontFamily: "'JetBrains Mono', monospace",
    width: "100%",
    boxSizing: "border-box",
  },
  formActions: {
    display: "flex",
    gap: "8px",
    marginTop: "12px",
    justifyContent: "flex-end",
  },
  cancelBtn: {
    padding: "8px 16px",
    background: "transparent",
    border: `1px solid ${COLORS.wallBorder}`,
    borderRadius: "4px",
    color: "#a0a0b0",
    fontSize: "12px",
    cursor: "pointer",
  },
  confirmBtn: {
    padding: "8px 16px",
    background: "#4ecdc4",
    border: "none",
    borderRadius: "4px",
    color: "#050509",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
  },
  canvasWrapper: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#050508",
    borderRadius: "8px",
    border: `1px solid ${COLORS.wallBorder}`,
    overflow: "hidden",
    minHeight: "300px",
  },
  canvas: {
    imageRendering: "crisp-edges",
    cursor: "default",
  },
  rightPanel: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  editor: {
    padding: "20px",
    height: "100%",
    overflowY: "auto",
  },
  editorTitle: {
    margin: "0 0 20px 0",
    color: COLORS.white,
    fontSize: "16px",
    fontWeight: 500,
    display: "flex",
    alignItems: "baseline",
    gap: "8px",
  },
  editorId: {
    color: "#505060",
    fontSize: "11px",
    fontFamily: "'JetBrains Mono', monospace",
  },
  editorActions: {
    display: "flex",
    gap: "8px",
    marginTop: "20px",
    justifyContent: "space-between",
  },
  deleteObjectBtn: {
    padding: "10px 16px",
    background: "transparent",
    border: "1px solid #ff4b4b",
    borderRadius: "6px",
    color: "#ff4b4b",
    fontSize: "12px",
    cursor: "pointer",
  },
  saveBtn: {
    padding: "10px 20px",
    background: "#4ecdc4",
    border: "none",
    borderRadius: "6px",
    color: "#050509",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
  },
  noSelection: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#505060",
    fontSize: "13px",
    textAlign: "center",
    padding: "40px",
  },
  noSelectionIcon: {
    fontSize: "48px",
    marginBottom: "16px",
    opacity: 0.5,
  },
  hint: {
    color: "#404050",
    fontSize: "11px",
    marginTop: "4px",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 20px",
    borderTop: `1px solid ${COLORS.wallBorder}`,
    background: "#050510",
  },
  footerInfo: {
    color: "#707080",
    fontSize: "11px",
  },
  footerHint: {
    color: "#404050",
    fontSize: "10px",
    fontStyle: "italic",
  },
};
