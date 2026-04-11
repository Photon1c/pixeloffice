import { useState, useEffect, useRef } from 'react';

interface HealthMetrics {
  fps: number;
  memory: number | null;
  renderTime: number;
  agentCount: number;
  lastFrame: number;
  errors: number;
  warnings: number;
  healthyFrames: number;
}

interface StabilityMonitorProps {
  visible?: boolean;
}

export function StabilityMonitor({ visible = true }: StabilityMonitorProps) {
  const [metrics, setMetrics] = useState<HealthMetrics>({
    fps: 60,
    memory: null,
    renderTime: 16,
    agentCount: 0,
    lastFrame: Date.now(),
    errors: 0,
    warnings: 0,
    healthyFrames: 0,
  });
  const [isMinimized, setIsMinimized] = useState(false);
  
  const frameTimes = useRef<number[]>([]);
  const lastFrameTime = useRef(performance.now());
  const rafId = useRef<number | null>(null);
  const hasReportedCritical = useRef(false);
  const sampleCount = useRef(0);
  
  useEffect(() => {
    if (!visible) return;
    
    const measureFrame = () => {
      const now = performance.now();
      const delta = now - lastFrameTime.current;
      lastFrameTime.current = now;
      
      if (delta > 0 && delta < 500) {
        frameTimes.current.push(delta);
        if (frameTimes.current.length > 60) {
          frameTimes.current.shift();
        }
      }
      
      sampleCount.current++;
      
      let avgFrameTime = 16.67;
      let fps = 60;
      
      if (frameTimes.current.length >= 2) {
        avgFrameTime = frameTimes.current.reduce((a, b) => a + b, 0) / frameTimes.current.length;
        fps = Math.round(1000 / avgFrameTime);
      }
      
      const memory = (performance as any).memory 
        ? Math.round((performance as any).memory.usedJSHeapSize / 1048576) 
        : null;
      
      const healthyFrames = fps >= 40 ? (metrics.healthyFrames + 1) : 0;
      
      setMetrics(prev => ({
        ...prev,
        fps: Math.min(60, Math.max(1, fps)),
        memory,
        renderTime: Math.round(avgFrameTime),
        agentCount: 0,
        healthyFrames,
      }));
      
      if (fps >= 40 && !hasReportedCritical.current) {
        hasReportedCritical.current = true;
      }
      
      rafId.current = requestAnimationFrame(measureFrame);
    };
    
    rafId.current = requestAnimationFrame(measureFrame);
    
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [visible, metrics.healthyFrames]);
  
  const getStatusColor = () => {
    if (metrics.fps < 20) return '#dc3545';
    if (metrics.fps < 40) return '#ffc107';
    return '#20c997';
  };
  
  const getStatusText = () => {
    if (metrics.fps < 20) return 'CRITICAL';
    if (metrics.fps < 40) return 'SLOW';
    return 'HEALTHY';
  };
  
  if (!visible) return null;
  
  if (isMinimized) {
    return (
      <div 
        onClick={() => setIsMinimized(false)}
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          background: 'rgba(0, 0, 0, 0.7)',
          border: '1px solid #495057',
          borderRadius: '20px',
          padding: '6px 10px',
          cursor: 'pointer',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span style={{ 
          width: '6px', 
          height: '6px', 
          borderRadius: '50%', 
          background: getStatusColor(),
        }} />
        <span style={{ color: '#6c757d', fontSize: '10px', fontFamily: 'monospace' }}>
          {metrics.fps} FPS
        </span>
      </div>
    );
  }
  
  return (
    <div 
      onDoubleClick={() => setIsMinimized(true)}
      style={{
        position: 'absolute',
        top: 10,
        right: 10,
        background: 'rgba(0, 0, 0, 0.85)',
        border: `1px solid ${getStatusColor()}`,
        borderRadius: '8px',
        padding: '10px 14px',
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#e9ecef',
        zIndex: 1000,
        minWidth: '180px',
        backdropFilter: 'blur(4px)',
        boxShadow: `0 0 10px ${getStatusColor()}40`,
      }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        marginBottom: '8px',
        borderBottom: '1px solid #495057',
        paddingBottom: '6px',
      }}>
        <span style={{ 
          width: '8px', 
          height: '8px', 
          borderRadius: '50%', 
          background: getStatusColor(),
          boxShadow: `0 0 6px ${getStatusColor()}`,
        }} />
        <span style={{ fontWeight: 'bold', color: getStatusColor() }}>
          {getStatusText()}
        </span>
        <span style={{ marginLeft: 'auto', color: '#6c757d' }}>
          PIXEL OFFICE
        </span>
        <button 
          onClick={(e) => { e.stopPropagation(); setIsMinimized(true); }}
          style={{
            background: 'none',
            border: 'none',
            color: '#6c757d',
            cursor: 'pointer',
            padding: '0 4px',
            fontSize: '12px',
          }}
        >
          −
        </button>
      </div>
      
      <div style={{ display: 'grid', gap: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#6c757d' }}>FPS</span>
          <span style={{ 
            color: getStatusColor(),
            fontWeight: 'bold',
            fontSize: '13px',
          }}>
            {metrics.fps}
          </span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#6c757d' }}>Frame Time</span>
          <span style={{ 
            color: metrics.renderTime > 16.67 ? '#ffc107' : '#20c997',
          }}>
            {metrics.renderTime.toFixed(1)}ms
          </span>
        </div>
        
        {metrics.memory && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#6c757d' }}>Memory</span>
            <span style={{ 
              color: metrics.memory > 200 ? '#ffc107' : '#20c997',
            }}>
              {metrics.memory}MB
            </span>
          </div>
        )}
        
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#6c757d' }}>Status</span>
          <span style={{ 
            color: '#20c997',
          }}>
            RENDERING
          </span>
        </div>
      </div>
      
      <div style={{ 
        marginTop: '8px', 
        paddingTop: '6px', 
        borderTop: '1px solid #495057',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '10px',
        color: '#6c757d',
      }}>
        <span>Frames: {frameTimes.current.length}</span>
      </div>
    </div>
  );
}

export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const handleError = (e: ErrorEvent) => {
      setHasError(true);
      setError(e.error);
    };
    
    const handleRejection = (e: PromiseRejectionEvent) => {
      setHasError(true);
      setError(e.reason);
    };
    
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);
  
  if (hasError) {
    return (
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'rgba(220, 53, 69, 0.9)',
        color: 'white',
        padding: '20px',
        borderRadius: '8px',
        textAlign: 'center',
        maxWidth: '400px',
      }}>
        <h3 style={{ marginTop: 0 }}>⚠️ Application Error</h3>
        <p>{error?.message || 'An unexpected error occurred'}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            background: 'white',
            color: '#dc3545',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '10px',
          }}
        >
          Reload Page
        </button>
      </div>
    );
  }
  
  return <>{children}</>;
}

export default { StabilityMonitor, ErrorBoundary };