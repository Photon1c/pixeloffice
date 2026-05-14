import { useState } from "react";

const DEFAULT_PLAYLIST_ID = "PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf";

export default function YouTubePlayer() {
  const [playlistId, setPlaylistId] = useState(() => {
    return localStorage.getItem("youtube_playlist_id") || DEFAULT_PLAYLIST_ID;
  });
  const [minimized, setMinimized] = useState(() => {
    return localStorage.getItem("youtube_minimized") === "true";
  });
  const [showConfig, setShowConfig] = useState(false);
  const [input, setInput] = useState("");

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

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "6px" }}>
        <button
          onClick={() => setShowConfig(!showConfig)}
          style={{ background: "none", border: "none", color: "#606070", cursor: "pointer", fontSize: "10px", padding: "2px 4px" }}
          title="Configure playlist"
        >
          ⚙
        </button>
        <span style={{ fontSize: "9px", color: "#606070", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {minimized ? "Player hidden" : "Now playing"}
        </span>
        <button
          onClick={() => { setMinimized(!minimized); localStorage.setItem("youtube_minimized", String(!minimized)); }}
          style={{ background: "none", border: "none", color: "#4ecdc4", cursor: "pointer", fontSize: "10px", padding: "2px 4px" }}
        >
          {minimized ? "⬜ Show" : "🔼"}
        </button>
      </div>
      {showConfig && (
        <div style={{ display: "flex", gap: "4px", marginBottom: "6px" }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="YouTube playlist ID"
            onKeyDown={e => e.key === "Enter" && handleApply()}
            style={{
              flex: 1, padding: "4px 6px", fontSize: "10px", background: "#1a1a2a",
              border: "1px solid #2a3548", borderRadius: "3px", color: "#e8e8f0",
            }}
          />
          <button onClick={handleApply} style={{
            padding: "4px 8px", fontSize: "10px", background: "#4a90d9",
            border: "none", borderRadius: "3px", color: "#fff", cursor: "pointer",
          }}>
            Set
          </button>
        </div>
      )}
      {!minimized && (
        <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", borderRadius: "4px" }}>
          <iframe
            src={src}
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none", borderRadius: "4px" }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
    </div>
  );
}
