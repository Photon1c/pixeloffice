import { useState } from "react";

const DEFAULT_PLAYLIST_ID = "PLfk0U1GyjVCZCxHNHlaxwswG2IPL774yX";

const btnStyle: React.CSSProperties = {
  background: "#1a2a3a", border: "none", borderRadius: "4px",
  color: "#e8e8f0", cursor: "pointer", fontSize: "11px", padding: "4px 8px",
  lineHeight: 1,
};

const PRESETS = [
  "Flight Doms",
  "Falcon Vision",
  "Flight Sim",
  "Spamisher",
];

export default function YouTubePlayer() {
  const [playlistId, setPlaylistId] = useState(() => {
    return localStorage.getItem("youtube_playlist_id") || DEFAULT_PLAYLIST_ID;
  });
  const [minimized, setMinimized] = useState(() => {
    return localStorage.getItem("youtube_minimized") === "true";
  });
  const [showConfig, setShowConfig] = useState(false);
  const [input, setInput] = useState("");
  const [preset, setPreset] = useState("");

  const src = `https://www.youtube.com/embed?listType=playlist&list=${playlistId}`;

  const handleApply = () => {
    const val = input.trim();
    if (val) {
      setPlaylistId(val);
      localStorage.setItem("youtube_playlist_id", val);
      setShowConfig(false);
      setInput("");
    }
  };

  const handleGo = () => {
    if (preset) console.log("Go:", preset);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "3px", marginBottom: "3px" }}>
        <span style={{ fontSize: "9px" }}>🎵</span>
        <button
          onClick={() => setShowConfig(!showConfig)}
          style={{ background: "none", border: "none", color: "#606070", cursor: "pointer", fontSize: "8px", padding: "1px 3px" }}
          title="Configure playlist"
        >
          ⚙
        </button>
        <span style={{ fontSize: "8px", color: "#606070", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {minimized ? "Player hidden" : "Now playing"}
        </span>
        <button
          onClick={() => { setMinimized(!minimized); localStorage.setItem("youtube_minimized", String(!minimized)); }}
          style={{ background: "none", border: "none", color: "#4ecdc4", cursor: "pointer", fontSize: "8px", padding: "1px 3px" }}
        >
          {minimized ? "⬜ Show" : "🔼"}
        </button>
      </div>
      {showConfig && (
        <div style={{ display: "flex", gap: "3px", marginBottom: "4px" }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="YouTube playlist ID"
            onKeyDown={e => e.key === "Enter" && handleApply()}
            style={{
              flex: 1, padding: "3px 5px", fontSize: "9px", background: "#1a1a2a",
              border: "1px solid #2a3548", borderRadius: "3px", color: "#e8e8f0",
            }}
          />
          <button onClick={handleApply} style={{
            padding: "3px 6px", fontSize: "9px", background: "#4a90d9",
            border: "none", borderRadius: "3px", color: "#fff", cursor: "pointer",
          }}>
            Set
          </button>
        </div>
      )}
      {!minimized && (
        <div>
          <div style={{ display: "none" }}>
            <iframe title="youtube" src={src} />
          </div>
          <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
            <button style={btnStyle} title="Previous">⏮</button>
            <button style={{ ...btnStyle, background: "#4ecdc4", color: "#0a0a12" }} title="Play/Pause">▶</button>
            <button style={btnStyle} title="Next">⏭</button>
          </div>
          <div style={{ display: "flex", gap: "4px", marginTop: "4px" }}>
            <select
              value={preset}
              onChange={e => setPreset(e.target.value)}
              style={{
                flex: 1, padding: "3px 5px", fontSize: "9px", background: "#1a1a2a",
                border: "1px solid #2a3548", borderRadius: "3px", color: "#e8e8f0",
                cursor: "pointer",
              }}
            >
              <option value="">Select...</option>
              {PRESETS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <button onClick={handleGo} style={{
              padding: "3px 8px", fontSize: "9px", fontWeight: 600, background: "#4ecdc4",
              border: "none", borderRadius: "3px", color: "#0a0a12", cursor: "pointer",
            }}>
              Go
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
