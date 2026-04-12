import { useState, useEffect, useRef } from 'react';
import { LAB_MODE } from "../config/env";

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
      
      
    </div>
  );
}

// Issue keywords that trigger alerts
const ISSUE_KEYWORDS = [
  'security', 'breach', 'urgent', 'emergency', 'critical', 'down', 
  'error', 'fail', 'hack', 'vulnerability', 'password', 'unauthorized',
  'leak', 'attack', 'threat', 'alert', 'warning', 'violation'
];

interface Issue {
  id: string;
  topic: string;
  agents: string[];
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export function AgentIssueMonitor({ 
  visible = true,
  onTestConversation
}: { 
  visible?: boolean;
  onTestConversation?: () => void;
}) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [testBubbles, setTestBubbles] = useState<{speaker: string; text: string}[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const dismissedRef = useRef<string[]>([]);
  
  const clearAndDismiss = (id: string) => {
    dismissedRef.current.push(id);
    setIssues(prev => prev.filter(i => i.id !== id));
  };
  
  const clearTestBubbles = () => {
    setTestBubbles([]);
    (window as any).clearSpeechBubbles?.();
  };
  
  const runTest = async () => {
    if (testBubbles.length > 0) {
      clearTestBubbles();
      return;
    }
    setIsTesting(true);
    setTestBubbles([]);
    onTestConversation?.();
  };
  
  // Called by parent when agent walk completes
  (window as any).showTestBubbles = (bubbles: {speaker: string; text: string}[]) => {
    setTestBubbles(bubbles);
    setIsTesting(false);
  };
  
  // Poll for cooler talk issues every 10 seconds
  useEffect(() => {
    if (!visible) return;
    
    const checkForIssues = async () => {
      try {
        const res = await fetch('/api/coolertalk/issues', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keywords: ISSUE_KEYWORDS })
        });
        const data = await res.json();
        if (data.issues) {
          // Filter for new issues (excluding dismissed ones)
          const newIssues = (data.issues as Issue[]).filter(i => 
            !issues.some(existing => existing.id === i.id) &&
            !dismissedRef.current.includes(i.id)
          );
          if (newIssues.length > 0) {
            setIssues(prev => [...newIssues, ...prev].slice(0, 10));
          }
        }
      } catch (e) {
        // Silent fail - monitor is optional
      }
    };
    
    checkForIssues();
    const interval = setInterval(checkForIssues, 10000);
    return () => clearInterval(interval);
  }, [visible, issues]);
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'medium': return '#ffc107';
      default: return '#6c757d';
    }
  };
  
  if (!visible) return null;
  
  return (
    <div style={{
      position: 'absolute',
      top: '45%',
      right: 10,
      background: 'rgba(0, 0, 0, 0.85)',
      border: issues.length > 0 ? '1px solid #dc3545' : '1px solid #343a40',
      borderRadius: '8px',
      padding: '8px 12px',
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#e9ecef',
      zIndex: 1001,
      width: '160px',
      maxHeight: '50vh',
      overflowY: 'auto',
      overflowX: 'hidden',
      backdropFilter: 'blur(4px)',
      boxShadow: issues.length > 0 ? '0 0 10px #dc354540' : 'none',
    }}>
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          cursor: 'pointer',
          marginBottom: '6px'
        }}
      >
        <span style={{ color: '#17a2b8', fontWeight: 'bold' }}>
          Agent2Agent
        </span>
        <button 
          onClick={runTest}
          style={{
            marginLeft: '8px',
            padding: '2px 6px',
            fontSize: '8px',
            background: testBubbles.length > 0 ? '#dc3545' : isTesting ? '#6c757d' : '#28a745',
            border: 'none',
            borderRadius: '3px',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          {testBubbles.length > 0 ? 'Clear' : isTesting ? '...' : 'Test'}
        </button>
        <span style={{ color: '#6c757d', marginLeft: '4px' }}>{isExpanded ? '−' : '+'}</span>
      </div>
      
      {isExpanded && (
        <>
          {testBubbles.length > 0 && (
            <div style={{ marginBottom: '8px' }}>
              {testBubbles.map((bubble, i) => (
                <div key={i} style={{
                  marginBottom: '4px',
                  padding: '4px 6px',
                  background: '#17a2b820',
                  borderLeft: '3px solid #17a2b8',
                  borderRadius: '3px',
                }}>
                  <div style={{ color: '#17a2b8', fontWeight: 'bold', fontSize: '9px' }}>
                    {bubble.speaker}
                  </div>
                  <div style={{ color: '#e9ecef', fontSize: '9px', marginTop: '2px' }}>
                    {bubble.text}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {issues.length === 0 && testBubbles.length === 0 ? (
            <div style={{ color: '#6c757d', fontStyle: 'italic' }}>
              No active issues detected
            </div>
          ) : (
            issues.map(issue => (
              <div key={issue.id} style={{
                marginBottom: '6px',
                padding: '4px 6px',
                background: `${getSeverityColor(issue.severity)}20`,
                borderLeft: `3px solid ${getSeverityColor(issue.severity)}`,
                borderRadius: '3px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ color: getSeverityColor(issue.severity), fontWeight: 'bold' }}>
                    {issue.severity.toUpperCase()}
                  </div>
                  <button 
                    onClick={() => clearAndDismiss(issue.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#6c757d',
                      cursor: 'pointer',
                      fontSize: '9px',
                      padding: '0 4px',
                    }}
                  >✕</button>
                </div>
                <div style={{ color: '#e9ecef', marginTop: '2px', wordBreak: 'break-word' }}>
                  {issue.topic}
                </div>
                <div style={{ color: '#6c757d', fontSize: '9px', marginTop: '2px' }}>
                  {issue.agents.join(' ↔ ')}
                </div>
              </div>
            ))
          )}
          
          {issues.length > 0 && (
            <button 
              onClick={() => {
                issues.forEach(i => dismissedRef.current.push(i.id));
                setIssues([]);
              }}
              style={{
                marginTop: '6px',
                padding: '4px 8px',
                background: 'transparent',
                border: '1px solid #6c757d',
                borderRadius: '4px',
                color: '#6c757d',
                fontSize: '9px',
                cursor: 'pointer',
              }}
            >
              Clear Issues
            </button>
          )}
        </>
      )}
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

export default { StabilityMonitor, AgentIssueMonitor, ErrorBoundary };