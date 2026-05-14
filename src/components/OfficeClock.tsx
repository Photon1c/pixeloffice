import React, { useState, useEffect } from "react";

interface OfficeClockProps {
  onHourChange?: (hour: number) => void;
  periodLabel?: string;
  embedded?: boolean;
}

export default function OfficeClock({ onHourChange, periodLabel, embedded }: OfficeClockProps) {
  const [time, setTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const oldHour = time.getHours();
      const newHour = now.getHours();
      
      setTime(now);
      
      if (oldHour !== newHour && onHourChange) {
        onHourChange(newHour);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [time, onHourChange]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  };

  const getDayLabel = (date: Date) => {
    return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const clockStyle: React.CSSProperties = embedded ? {
    background: 'rgba(0, 0, 0, 0.8)',
    border: '2px solid #333',
    borderRadius: '8px',
    padding: '8px 12px',
    fontFamily: 'monospace',
    color: '#00ff00',
    textAlign: 'center' as const,
    marginBottom: '10px',
    boxShadow: '0 0 10px rgba(0, 255, 0, 0.2)',
    userSelect: 'none' as const,
  } : {
    position: 'absolute' as const,
    top: '10px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(0, 0, 0, 0.8)',
    border: '2px solid #333',
    borderRadius: '8px',
    padding: '8px 16px',
    fontFamily: 'monospace',
    color: '#00ff00',
    textAlign: 'center' as const,
    zIndex: 1000,
    boxShadow: '0 0 10px rgba(0, 255, 0, 0.2)',
    pointerEvents: 'none' as const,
    userSelect: 'none' as const,
  };

  return (
    <div style={clockStyle}>
      <div style={{ fontSize: '10px', color: '#888', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '1px' }}>
        {getDayLabel(time)} {periodLabel && <span style={{ color: '#4ecdc4', marginLeft: '8px' }}>• {periodLabel}</span>}
      </div>
      <div style={{ fontSize: embedded ? '18px' : '24px', fontWeight: 'bold', letterSpacing: '2px', textShadow: '0 0 5px #00ff00' }}>
        {formatTime(time)}
      </div>
      <div style={{ fontSize: '9px', color: '#666', marginTop: '2px' }}>
        OFFICE TIME (HKT)
      </div>
    </div>
  );
}
