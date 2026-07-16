import { useEffect, useState, useCallback } from "react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const API_BASE = "";

interface TaskItem {
  id: number;
  title: string;
  status: string;
  priority: string;
  due: string | null;
  tags: string[];
}

interface CalendarEvent {
  id: number;
  title: string;
  type: string;
  start_time: string;
  end_time: string;
}

interface ScrumSession {
  id: string;
  topic: string;
  participants: string[];
  created_at: string;
}

interface CalendarDay {
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: { type: "task" | "event" | "scrum"; label: string; id: string | number; color: string }[];
}

const TYPE_COLORS: Record<string, string> = {
  work: "#4ecdc4",
  hobby: "#a55eea",
  admin: "#feca57",
  "self-care": "#ff9ff3",
  social: "#54a0ff",
  health: "#26de81",
  task: "#ff6b6b",
  scrum: "#2ecc71",
};

export default function CalendarPanel({ onClose }: { onClose: () => void }) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [scrumSessions, setScrumSessions] = useState<ScrumSession[]>([]);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksRes, eventsRes, scrumRes] = await Promise.all([
        fetch(`${API_BASE}/api/tasks-v2`).catch(() => ({ ok: false, json: async () => ({ tasks: [] }) })),
        fetch(`${API_BASE}/api/events/today`).catch(() => ({ ok: false, json: async () => ({ events: [] }) })),
        fetch(`${API_BASE}/api/cooler/sessions/db?type=cooler&limit=50`).catch(() => ({ ok: false, json: async () => ({ sessions: [] }) })),
      ]);

      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setTasks(data.tasks || []);
      }
      if (eventsRes.ok) {
        const data = await eventsRes.json();
        setEvents(data.events || []);
      }
      if (scrumRes.ok) {
        const data = await scrumRes.json();
        const sessions = data.sessions || [];
        const unique = sessions.filter((s: ScrumSession, idx: number, arr: ScrumSession[]) =>
          arr.findIndex(s2 => s2.id === s.id) === idx
        );
        setScrumSessions(unique.slice(0, 30));
      }
    } catch (err) {
      console.error("Calendar fetch error:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const calendarDays: CalendarDay[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push({ day: 0, isCurrentMonth: false, isToday: false, events: [] });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const isToday = dateStr === todayStr;
    const dayEvents: CalendarDay["events"] = [];

    tasks.forEach(t => {
      if (t.due) {
        const dueDate = t.due.slice(0, 10);
        if (dueDate === dateStr) {
          dayEvents.push({ type: "task", label: t.title, id: t.id, color: TYPE_COLORS.task });
        }
      }
    });

    events.forEach(e => {
      const eDate = e.start_time.slice(0, 10);
      if (eDate === dateStr) {
        dayEvents.push({ type: "event", label: e.title, id: e.id, color: TYPE_COLORS[e.type] || "#888" });
      }
    });

    scrumSessions.forEach(s => {
      const sDate = s.created_at?.slice(0, 10);
      if (sDate === dateStr) {
        dayEvents.push({ type: "scrum", label: s.topic || "SCRUM", id: s.id, color: TYPE_COLORS.scrum });
      }
    });

    calendarDays.push({ day: d, isCurrentMonth: true, isToday, events: dayEvents });
  }

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(v => v - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(v => v + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };
  const goToday = () => {
    const n = new Date();
    setViewYear(n.getFullYear());
    setViewMonth(n.getMonth());
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleCloseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  return (
    <div style={styles.overlay} onClick={handleOverlayClick}>
      <div style={styles.container} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={styles.title}>📅 Office Calendar</h3>
          <div style={{ display: "flex", gap: "4px" }}>
            <button style={styles.navBtn} onClick={prevMonth}>◀</button>
            <button style={styles.navBtn} onClick={goToday}>Today</button>
            <button style={styles.navBtn} onClick={nextMonth}>▶</button>
          </div>
          <button style={styles.closeBtn} onClick={handleCloseClick}>×</button>
        </div>

        <div style={{ padding: "12px 16px", fontSize: "14px", color: "#4ecdc4", fontWeight: "bold", textAlign: "center" }}>
          {MONTHS[viewMonth]} {viewYear}
        </div>

        <div style={styles.calendarGrid}>
          {DAYS.map(d => (
            <div key={d} style={styles.dayHeader}>{d}</div>
          ))}
          {calendarDays.map((cd, idx) => (
            <div
              key={idx}
              style={{
                ...styles.dayCell,
                ...(cd.isToday ? styles.todayCell : {}),
                ...(!cd.isCurrentMonth ? styles.otherMonth : {}),
                ...(expandedDay === cd.day && cd.isCurrentMonth ? styles.expandedCell : {}),
              }}
              onClick={() => cd.isCurrentMonth && setExpandedDay(expandedDay === cd.day ? null : cd.day)}
            >
              {cd.day > 0 && (
                <>
                  <span style={styles.dayNumber}>{cd.day}</span>
                  {cd.events.length > 0 && (
                    <div style={styles.eventDots}>
                      {cd.events.slice(0, 3).map((ev, ei) => (
                        <span key={ei} style={{ ...styles.eventDot, background: ev.color }} title={ev.label} />
                      ))}
                      {cd.events.length > 3 && <span style={styles.moreDot}>+{cd.events.length - 3}</span>}
                    </div>
                  )}
                  {expandedDay === cd.day && (
                    <div style={styles.dayDetail}>
                      {cd.events.length === 0 && <div style={styles.noEvents}>No events</div>}
                      {cd.events.map((ev, ei) => (
                        <div key={ei} style={{ ...styles.detailItem, borderLeftColor: ev.color }}>
                          <span style={{ fontSize: "8px", color: "#666", textTransform: "uppercase", minWidth: "32px" }}>{ev.type}</span>
                          <span style={{ fontSize: "10px", color: "#ddd", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {ev.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {loading && <div style={styles.loading}>Loading...</div>}

        <div style={styles.legend}>
          <div style={styles.legendItem}><span style={{ ...styles.legendDot, background: TYPE_COLORS.task }} /> Tasks due</div>
          <div style={styles.legendItem}><span style={{ ...styles.legendDot, background: TYPE_COLORS.scrum }} /> SCRUM sessions</div>
          <div style={styles.legendItem}><span style={{ ...styles.legendDot, background: TYPE_COLORS.work }} /> Calendar events</div>
        </div>

        <div style={styles.summary}>
          <div style={styles.stat}><span style={{ color: TYPE_COLORS.task }}>{tasks.length}</span> active tasks</div>
          <div style={styles.stat}><span style={{ color: TYPE_COLORS.scrum }}>{scrumSessions.length}</span> scrums this month</div>
          <div style={styles.stat}><span style={{ color: TYPE_COLORS.work }}>{events.length}</span> today's events</div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0,0,0,0.7)", display: "flex",
    alignItems: "center", justifyContent: "center", zIndex: 2000,
  },
  container: {
    width: "680px", maxWidth: "95vw", maxHeight: "90vh",
    background: "#0a0a12", borderRadius: "12px",
    border: "1px solid #1b2333", display: "flex", flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "14px 16px", borderBottom: "1px solid #1b2333",
  },
  title: { margin: 0, color: "#e8e8f0", fontSize: "14px" },
  navBtn: {
    padding: "6px 12px", background: "#1a2a2a", border: "1px solid #2a3548",
    borderRadius: "4px", color: "#4ecdc4", cursor: "pointer", fontSize: "11px",
    fontWeight: 600,
  },
  closeBtn: {
    background: "transparent", border: "none", color: "#707080",
    fontSize: "22px", cursor: "pointer", padding: "0 4px",
  },
  calendarGrid: {
    display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
    gap: "2px", padding: "8px 12px", flex: 1,
  },
  dayHeader: {
    textAlign: "center", color: "#606070", fontSize: "10px",
    fontWeight: 600, padding: "6px 0", textTransform: "uppercase",
  },
  dayCell: {
    background: "#12121c", borderRadius: "6px", padding: "4px",
    minHeight: "60px", cursor: "pointer", position: "relative" as const,
    border: "1px solid transparent", transition: "all 0.15s",
    display: "flex", flexDirection: "column",
  },
  todayCell: {
    border: "1px solid #4ecdc4", background: "rgba(78, 205, 196, 0.08)",
  },
  otherMonth: { opacity: 0.3 },
  expandedCell: {
    border: "1px solid #feca57", background: "rgba(254, 202, 87, 0.06)",
  },
  dayNumber: {
    fontSize: "11px", color: "#a0a0b0", fontWeight: 600,
    marginBottom: "2px",
  },
  eventDots: {
    display: "flex", gap: "3px", flexWrap: "wrap" as const, alignItems: "center",
  },
  eventDot: {
    width: "6px", height: "6px", borderRadius: "50%", display: "inline-block",
  },
  moreDot: {
    fontSize: "8px", color: "#606070",
  },
  dayDetail: {
    marginTop: "4px", display: "flex", flexDirection: "column", gap: "2px",
  },
  detailItem: {
    display: "flex", gap: "4px", alignItems: "center",
    borderLeft: "2px solid", paddingLeft: "4px",
  },
  noEvents: { fontSize: "9px", color: "#505060", fontStyle: "italic" },
  loading: {
    padding: "12px", textAlign: "center", color: "#606070", fontSize: "12px",
  },
  legend: {
    display: "flex", gap: "16px", padding: "8px 16px",
    borderTop: "1px solid #1b2333", justifyContent: "center",
  },
  legendItem: {
    display: "flex", alignItems: "center", gap: "4px",
    fontSize: "10px", color: "#808090",
  },
  legendDot: { width: "8px", height: "8px", borderRadius: "50%" },
  summary: {
    display: "flex", gap: "16px", padding: "8px 16px",
    borderTop: "1px solid #1b2333", justifyContent: "center",
  },
  stat: {
    fontSize: "10px", color: "#606070",
  },
};
