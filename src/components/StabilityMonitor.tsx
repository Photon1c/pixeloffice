import React, { useState, useEffect, useRef } from 'react';

// Common issue keywords that agents might discuss
const ISSUE_KEYWORDS = [
  'error', 'bug', 'fail', 'critical', 'emergency', 'urgent', 'problem', 'fix',
  'broken', 'latency', 'slow', 'timeout', 'offline', 'security', 'vulnerability',
  'leak', 'attack', 'threat', 'alert', 'warning', 'violation'
];

interface Issue {
  id: string;
  topic: string;
  agents: string[];
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface StabilityMonitorProps {
  metrics: {
    cpu: number;
    memory: number;
    fps: number;
  };
  visible?: boolean;
  onReset?: () => void;
  embedded?: boolean;
  resetInterval?: number;
  onResetIntervalChange?: (interval: number) => void;
}

export interface AgentIssueMonitorProps { 
  visible?: boolean;
  onTestConversation?: () => void;
  embedded?: boolean;
}

interface ConversationData {
  sessionId: string;
  participants: string[];
  conversation: { speaker: string; text: string }[];
  timestamp: number;
}

interface TestBubble {
  speaker: string;
  text: string;
  model?: string;
}

type TestStatus = "idle" | "testing" | "success" | "error";

export function StabilityMonitor({ 
  metrics,
  visible = true,
  onReset,
  resetInterval = 20,
  onResetIntervalChange
}: StabilityMonitorProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [intervalValue, setIntervalValue] = useState(String(resetInterval));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (resetInterval > 0 && onReset) {
      intervalRef.current = setInterval(() => {
        onReset();
      }, resetInterval * 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [resetInterval, onReset]);
  
  const handleIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setIntervalValue(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 0 && onResetIntervalChange) {
      onResetIntervalChange(num);
    }
  };
  
  if (!visible) return null;
  
  return (
    <div style={{
      position: 'absolute',
      bottom: 20,
      right: 20,
      background: 'rgba(0, 0, 0, 0.8)',
      border: '1px solid #17a2b8',
      borderRadius: '8px',
      padding: '12px',
      fontFamily: 'monospace',
      color: '#e9ecef',
      zIndex: 1000,
      width: '240px',
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ color: '#17a2b8', fontWeight: 'bold' }}>Stability Monitor</span>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
        >
          {isExpanded ? '−' : '+'}
        </button>
      </div>
      
      {isExpanded && (
        <>
          <div style={{ marginBottom: '4px' }}>
            CPU: <span style={{ color: metrics.cpu > 80 ? '#dc3545' : '#28a745' }}>{metrics.cpu}%</span>
          </div>
          <div style={{ marginBottom: '4px' }}>
            MEM: <span style={{ color: metrics.memory > 80 ? '#dc3545' : '#28a745' }}>{metrics.memory}%</span>
          </div>
          <div style={{ marginBottom: '12px' }}>
            FPS: <span style={{ color: metrics.fps < 30 ? '#dc3545' : '#28a745' }}>{metrics.fps}</span>
          </div>
          
          <div style={{ marginBottom: '8px' }}>
            <label style={{ fontSize: '9px', color: '#6c757d', display: 'block', marginBottom: '4px' }}>
              Reset Arena Interval (seconds)
            </label>
            <input
              type="number"
              min="0"
              value={intervalValue}
              onChange={handleIntervalChange}
              style={{
                width: '100%',
                padding: '4px 6px',
                fontSize: '10px',
                background: '#1a1a2e',
                border: '1px solid #2a3548',
                borderRadius: '4px',
                color: '#e9ecef',
                boxSizing: 'border-box',
              }}
              placeholder="0 to disable"
            />
          </div>
          
          <button 
            onClick={onReset}
            style={{
              width: '100%',
              padding: '6px',
              background: '#17a2b8',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Reset Arena
          </button>
        </>
      )}
    </div>
  );
}

export function AgentIssueMonitor({ 
  visible = true,
  onTestConversation,
  embedded = false
}: AgentIssueMonitorProps) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [testBubbles, setTestBubbles] = useState<TestBubble[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");
  const testTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTestingRef = useRef(false);
  const [currentTopic, setCurrentTopic] = useState<string>('');
  const [topicSource, setTopicSource] = useState<string>('');
  const [selectedTopicSource, setSelectedTopicSource] = useState<string>("auto");
  const [isConfiguringGithub, setIsConfiguringGithub] = useState(false);
  const [availableRepos, setAvailableRepos] = useState<any[]>([]);
  const [manualRepo, setManualRepo] = useState("");
  const [currentRepo, setCurrentRepo] = useState("");
  const dismissedRef = useRef<string[]>([]);
  const issueIdsRef = useRef<Set<string>>(new Set()); // Track issue IDs to prevent duplicates
  const [conversationData, setConversationData] = useState<ConversationData | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  const clearAndDismiss = (id: string) => {
    dismissedRef.current.push(id);
    issueIdsRef.current.delete(id); // Remove from tracking
    setIssues(prev => prev.filter(i => i.id !== id));
  };
  
  const clearTestBubbles = () => {
    setTestBubbles([]);
    setTestStatus("idle");
    isTestingRef.current = false;
    if (testTimeoutRef.current) clearTimeout(testTimeoutRef.current);
    (window as any).clearSpeechBubbles?.();
  };
  
  // Fetch current repo config
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/scrum/github/status');
        const data = await res.json();
        if (data.repo) setCurrentRepo(data.repo);
      } catch (err) {
        console.warn('[AgentIssueMonitor] Failed to fetch github status:', err);
      }
    };
    fetchConfig();
  }, []);

  // Fetch current topic more frequently (every 60 seconds)
  useEffect(() => {
    if (!visible) return;
    
    const fetchTopic = async () => {
      try {
        const res = await fetch(`/api/cooler/topics/current?source=${selectedTopicSource}`);
        const data = await res.json();
        if (data.topic) {
          const topicValue = typeof data.topic === 'object' ? data.topic.title : data.topic;
          setCurrentTopic(topicValue);
          setTopicSource(data.topic?.source || data.topic?.category || 'news');
        }
      } catch (err) {
        console.warn('[AgentIssueMonitor] Failed to fetch topic:', err);
      }
    };
    
    fetchTopic();
    const interval = setInterval(fetchTopic, 60000);
    return () => clearInterval(interval);
  }, [visible, selectedTopicSource]);

  const fetchRepos = async () => {
    try {
      const res = await fetch('/api/github/repos');
      const data = await res.json();
      if (data.repos) setAvailableRepos(data.repos);
    } catch (err) {
      console.warn('[AgentIssueMonitor] Failed to fetch repos:', err);
    }
  };

  const updateRepoConfig = async (repoName: string) => {
    try {
      const res = await fetch('/api/github/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo: repoName })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentRepo(repoName);
        setIsConfiguringGithub(false);
        // Refresh topic after changing repo
        const refreshRes = await fetch('/api/cooler/topics/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source: 'github' })
        });
        const refreshData = await refreshRes.json();
        if (refreshData.topic) {
          const topicValue = typeof refreshData.topic === 'object' ? refreshData.topic.title : refreshData.topic;
          setCurrentTopic(topicValue);
          setTopicSource(refreshData.topic?.source || 'github');
        }
      }
    } catch (err) {
      console.warn('[AgentIssueMonitor] Failed to update repo config:', err);
    }
  };
  
  const runTest = async () => {
    if (testBubbles.length > 0) {
      clearTestBubbles();
      return;
    }
    setIsTesting(true);
    isTestingRef.current = true;
    setTestStatus("testing");
    setTestBubbles([]);
    onTestConversation?.();

    if (testTimeoutRef.current) clearTimeout(testTimeoutRef.current);
    testTimeoutRef.current = setTimeout(() => {
      if (isTestingRef.current) {
        setIsTesting(false);
        isTestingRef.current = false;
        setTestStatus("error");
        setTimeout(() => setTestStatus("idle"), 3000);
      }
    }, 15000);
  };
  
  const saveConversation = async () => {
    if (!conversationData) return;
    
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/conversation/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(conversationData)
      });
      const result = await res.json();
      if (result.success) {
        setSaveStatus('saved');
        setTimeout(() => {
          setSaveStatus('idle');
          setConversationData(null);
        }, 3000);
      } else {
        setSaveStatus('error');
      }
    } catch (err) {
      console.error('[AgentIssueMonitor] Failed to save conversation:', err);
      setSaveStatus('error');
    }
  };
  
  // Called by parent when agent walk completes
  useEffect(() => {
    (window as any).showTestBubbles = (bubbles: TestBubble[]) => {
      setTestBubbles(bubbles);
      setIsTesting(false);
      isTestingRef.current = false;
      setTestStatus("success");
      if (testTimeoutRef.current) clearTimeout(testTimeoutRef.current);
      setTimeout(() => setTestStatus("idle"), 3000);
    };

    (window as any).showTestError = (err?: string) => {
      setIsTesting(false);
      isTestingRef.current = false;
      setTestStatus("error");
      if (testTimeoutRef.current) clearTimeout(testTimeoutRef.current);
      setTimeout(() => setTestStatus("idle"), 4000);
    };
    
    (window as any).enableSaveConversation = (data: ConversationData) => {
      setConversationData(data);
      setSaveStatus('idle');
    };
    
    return () => {
      delete (window as any).showTestBubbles;
      delete (window as any).showTestError;
      delete (window as any).enableSaveConversation;
    };
  }, []);
  
  // Cleanup test timeout on unmount
  useEffect(() => {
    return () => {
      if (testTimeoutRef.current) clearTimeout(testTimeoutRef.current);
    };
  }, []);

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
          // Filter for new issues (excluding dismissed ones and already-tracked ones)
          const newIssues = (data.issues as Issue[]).filter(i => 
            !dismissedRef.current.includes(i.id) &&
            !issueIdsRef.current.has(i.id)
          );
          if (newIssues.length > 0) {
            setIssues(prev => {
              // Update tracking ref
              newIssues.forEach(i => issueIdsRef.current.add(i.id));
              // Add new issues and limit to 10
              const updated = [...newIssues, ...prev].slice(0, 10);
              // Keep ref in sync with actual state
              issueIdsRef.current = new Set(updated.map(i => i.id));
              return updated;
            });
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
  
  const containerStyle = embedded ? {
    position: 'relative' as const,
    marginTop: '16px',
    background: 'rgba(0, 0, 0, 0.85)',
    border: issues.length > 0 ? '1px solid #dc3545' : '1px solid #17a2b8',
    borderRadius: '8px',
    padding: '8px 12px',
    fontFamily: 'monospace',
    fontSize: '10px',
    color: '#e9ecef',
    overflowY: 'auto' as const,
    overflowX: 'hidden' as const,
    boxShadow: issues.length > 0 ? '0 0 10px #dc354540' : '0 0 10px #17a2b840',
  } : {
    position: 'absolute' as const,
    top: '45%',
    right: 10,
    background: 'rgba(0, 0, 0, 0.9)',
    border: issues.length > 0 ? '1px solid #dc3545' : '1px solid #17a2b8',
    borderRadius: '8px',
    padding: '8px 12px',
    fontFamily: 'monospace',
    fontSize: '10px',
    color: '#e9ecef',
    zIndex: 1001,
    width: '234px',
    maxHeight: '60vh',
    overflowY: 'auto' as const,
    overflowX: 'hidden' as const,
    backdropFilter: 'blur(4px)',
    boxShadow: issues.length > 0 ? '0 0 10px #dc354540' : '0 0 10px #17a2b840',
  };
  
  return (
    <div style={containerStyle}>
      <div 
        style={{
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          marginBottom: '8px',
          flexWrap: 'wrap',
          gap: '4px'
        }}
      >
        <div style={{ flex: 1, minWidth: '150px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#17a2b8', fontWeight: 'bold', fontSize: '12px' }}>
              Agent2Agent
            </span>
            {selectedTopicSource === 'github' && (
              <span 
                onClick={() => {
                  setIsConfiguringGithub(!isConfiguringGithub);
                  if (!isConfiguringGithub) fetchRepos();
                }}
                style={{ 
                  fontSize: '9px', 
                  color: currentRepo ? '#feca57' : '#6c757d', 
                  cursor: 'pointer',
                  background: '#2a2a3a',
                  padding: '1px 6px',
                  borderRadius: '3px',
                  border: '1px solid #495057'
                }}
                title={currentRepo ? `Repo: ${currentRepo}` : "Click to set repo"}
              >
                📦 {currentRepo || "set repo"}
              </span>
            )}
          </div>
          {currentTopic && (
            <div style={{ fontSize: '9px', color: '#6c757d', marginTop: '2px', lineHeight: '1.2' }}>
              <span style={{ color: '#feca57' }}>[{topicSource}]</span> {currentTopic.length > 70 ? currentTopic.slice(0, 70) + '...' : currentTopic}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          <select
            value={selectedTopicSource}
            onChange={(e) => { setSelectedTopicSource(e.target.value); }}
            style={{
              padding: '2px 4px',
              fontSize: '9px',
              background: '#495057',
              border: 'none',
              borderRadius: '3px',
              color: 'white',
              cursor: 'pointer',
            }}
            title="Topic source"
          >
            <option value="auto">Auto</option>
            <option value="news">News</option>
            <option value="github">GitHub</option>
          </select>
          <button 
            onClick={async () => {
              try {
                const res = await fetch('/api/cooler/topics/refresh', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ source: selectedTopicSource })
                });
                const data = await res.json();
                if (data.topic) {
                  const topicValue = typeof data.topic === 'object' ? data.topic.title : data.topic;
                  setCurrentTopic(topicValue);
                  setTopicSource(data.topic?.source || 'news');
                }
              } catch (err) {
                console.warn('[AgentIssueMonitor] Failed to refresh topic:', err);
              }
            }}
            style={{
              padding: '2px 6px',
              fontSize: '9px',
              background: '#495057',
              border: 'none',
              borderRadius: '3px',
              color: 'white',
              cursor: 'pointer',
            }}
            title="Refresh topic"
          >
            ↻
          </button>
          <button 
            onClick={runTest}
            style={{
              padding: '4px 10px',
              fontSize: '10px',
              background: testBubbles.length > 0 ? '#dc3545' : testStatus === 'success' ? '#20c997' : isTesting ? '#6c757d' : '#28a745',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'background 0.3s',
            }}
          >
            {testBubbles.length > 0 ? 'Clear' : testStatus === 'success' ? '✓' : isTesting ? '...' : 'Test'}
          </button>
          <button 
            onClick={() => {
              setIssues(prev => {
                const newIssue: typeof prev[0] = {
                  id: `issue-${Date.now()}`,
                  severity: 'medium',
                  topic: `Standup ${prev.length + 1}: Sprint review and planning`,
                  agents: ['HermitClaw', 'IronClaw'],
                  timestamp: Date.now(),
                };
                issueIdsRef.current.add(newIssue.id);
                return [...prev, newIssue];
              });
            }}
            style={{
              padding: '4px 10px',
              fontSize: '10px',
              background: '#17a2b8',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Next
          </button>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              padding: '4px 10px',
              fontSize: '10px',
              background: '#495057',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            {isExpanded ? '−' : '+'}
          </button>
        </div>
      </div>

      {isConfiguringGithub && (
        <div style={{
          background: '#1a1a2e',
          border: '1px solid #4a4a5e',
          borderRadius: '4px',
          padding: '8px',
          marginBottom: '10px',
          animation: 'fadeIn 0.2s'
        }}>
          <div style={{ fontSize: '10px', color: '#17a2b8', marginBottom: '6px', fontWeight: 'bold' }}>
            Set GitHub Repository
          </div>
          <div style={{ fontSize: '8px', color: '#6c757d', marginBottom: '6px' }}>
            Current: <span style={{ color: currentRepo ? '#feca57' : '#6c757d' }}>{currentRepo || "none"}</span>
          </div>
          <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
            <input 
              placeholder="owner/repo (e.g., photon1c/pixeloffice)"
              value={manualRepo}
              onChange={(e) => setManualRepo(e.target.value)}
              style={{ flex: 1, fontSize: '10px', padding: '4px', background: '#2a2a3a', color: 'white', border: '1px solid #444' }}
            />
            <button 
              onClick={() => { if(manualRepo) updateRepoConfig(manualRepo); }}
              style={{ fontSize: '10px', padding: '4px 8px', background: '#17a2b8', border: 'none', borderRadius: '3px', color: 'white', cursor: 'pointer' }}
            >Set</button>
          </div>
          <input 
            placeholder="Task description (e.g., review PR #42, analyze issues)"
            style={{ width: '100%', fontSize: '10px', padding: '4px', background: '#2a2a3a', color: 'white', border: '1px solid #444', boxSizing: 'border-box' }}
          />
          <div style={{ fontSize: '8px', color: '#6c757d', marginTop: '4px' }}>
            Agents will use this repo and task for their next discussion
          </div>
        </div>
      )}
      
      {(testStatus === "success" || testStatus === "error") && !testBubbles.length ? (
        <div style={{
          padding: '6px 8px',
          marginBottom: '8px',
          borderRadius: '4px',
          fontSize: '10px',
          fontWeight: 'bold',
          textAlign: 'center',
          animation: 'fadeIn 0.3s',
          background: testStatus === 'success' ? '#20c99720' : '#dc354520',
          border: `1px solid ${testStatus === 'success' ? '#20c997' : '#dc3545'}`,
          color: testStatus === 'success' ? '#20c997' : '#dc3545',
        }}>
          {testStatus === 'success' ? '✓ Agent conversation test passed' : '✗ Agent conversation test failed or timed out'}
        </div>
      ) : null}

      {isExpanded && (
        <>
          {testBubbles.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ color: '#17a2b8', fontWeight: 'bold', fontSize: '10px' }}>
                  Test Conversation ({testBubbles.length} turns)
                </div>
                {conversationData && (
                  <button
                    onClick={saveConversation}
                    disabled={saveStatus === 'saving' || saveStatus === 'saved'}
                    style={{
                      padding: '3px 8px',
                      fontSize: '9px',
                      background: saveStatus === 'saved' ? '#20c997' : saveStatus === 'error' ? '#dc3545' : '#17a2b8',
                      border: 'none',
                      borderRadius: '3px',
                      color: 'white',
                      cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer',
                      opacity: saveStatus === 'saving' ? 0.6 : 1,
                    }}
                    title="Save conversation transcript as .md file"
                  >
                    {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? '✓ Saved' : saveStatus === 'error' ? 'Error' : 'Save'}
                  </button>
                )}
              </div>
              {testBubbles.map((bubble, i) => (
                <div key={i} style={{
                  marginBottom: '6px',
                  padding: '6px 8px',
                  background: '#17a2b820',
                  borderLeft: '3px solid #17a2b8',
                  borderRadius: '4px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ color: '#17a2b8', fontWeight: 'bold', fontSize: '10px' }}>
                      {bubble.speaker}
                    </div>
                    {bubble.model && (
                      <span style={{ 
                        fontSize: '8px', 
                        color: '#6c757d', 
                        background: '#1a1a2e',
                        padding: '1px 4px',
                        borderRadius: '2px',
                      }} title={`Model: ${bubble.model}`}>
                        {bubble.model}
                      </span>
                    )}
                  </div>
                  <div style={{ color: '#e9ecef', fontSize: '10px', marginTop: '2px' }}>
                    {bubble.text}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {issues.length === 0 && testBubbles.length === 0 ? (
            <div style={{ color: '#6c757d', fontStyle: 'italic', fontSize: '11px', padding: '12px' }}>
              No active issues detected. Click "Test" to run a conversation test, or "Next" to start a standup.
            </div>
          ) : (
            <div style={{ marginBottom: '8px' }}>
              <div style={{ color: '#6c757d', fontWeight: 'bold', marginBottom: '8px', fontSize: '10px' }}>
                Active Issues ({issues.length})
              </div>
              {issues.map((issue, idx) => (
                <div key={`${issue.id}-${idx}`} style={{
                  marginBottom: '8px',
                  padding: '8px 10px',
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
                  <div style={{ color: '#e9ecef', marginTop: '4px', wordBreak: 'break-word', fontSize: '11px' }}>
                    {issue.topic}
                  </div>
                  <div style={{ color: '#6c757d', fontSize: '10px', marginTop: '4px' }}>
                    {issue.agents.join(' ↔ ')}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {issues.length > 0 && (
            <button 
              onClick={() => {
                issues.forEach(i => dismissedRef.current.push(i.id));
                issueIdsRef.current.clear(); // Clear tracking ref
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
