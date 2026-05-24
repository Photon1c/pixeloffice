const LOG_LEVELS = {
  debug: { color: '#6c757d', icon: '🔍', enabled: false },
  info: { color: '#17a2b8', icon: 'ℹ️', enabled: true },
  warn: { color: '#ffc107', icon: '⚠️', enabled: true },
  error: { color: '#dc3545', icon: '❌', enabled: true },
  render: { color: '#20c997', icon: '🎨', enabled: true },
  agent: { color: '#6f42c1', icon: '🤖', enabled: true },
  network: { color: '#fd7e14', icon: '🌐', enabled: true },
  workflow: { color: '#007bff', icon: '📋', enabled: true },
  stigmergy: { color: '#20c997', icon: '🔮', enabled: true },
  coolertalkscrum: { color: '#e83e8c', icon: '💬', enabled: true },
};

type LogLevel = keyof typeof LOG_LEVELS;

function formatMessage(level: LogLevel, category: string, message: string, data?: any): string {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
  const levelInfo = LOG_LEVELS[level];
  
  const header = `%c${levelInfo.icon} [${timestamp}] [${category.toUpperCase()}]`;
  const styledHeader = header.replace('%c', '') + ' %c' + message;
  
  return styledHeader;
}

export function createLogger(category: string) {
  const getStyle = (level: LogLevel) => {
    const info = LOG_LEVELS[level];
    return `color: ${info.color}; font-weight: bold;`;
  };
  
  const dataStyle = 'color: #adb5bd; font-style: italic;';
  
  return {
    debug: (message: string, data?: any) => {
      if (!LOG_LEVELS.debug.enabled) return;
      console.debug(formatMessage('debug', category, message), data ? data : '');
    },
    info: (message: string, data?: any) => {
      if (!LOG_LEVELS.info.enabled) return;
      console.log(formatMessage('info', category, message), data ? data : '');
    },
    warn: (message: string, data?: any) => {
      if (!LOG_LEVELS.warn.enabled) return;
      console.warn(formatMessage('warn', category, message), data ? data : '');
    },
    error: (message: string, data?: any) => {
      if (!LOG_LEVELS.error.enabled) return;
      console.error(formatMessage('error', category, message), data ? data : '');
    },
    render: (message: string, data?: any) => {
      if (!LOG_LEVELS.render.enabled) return;
      console.log(formatMessage('render', category, message), data ? data : '');
    },
    agent: (message: string, data?: any) => {
      if (!LOG_LEVELS.agent.enabled) return;
      console.log(formatMessage('agent', category, message), data ? data : '');
    },
    network: (message: string, data?: any) => {
      if (!LOG_LEVELS.network.enabled) return;
      console.log(formatMessage('network', category, message), data ? data : '');
    },
    workflow: (message: string, data?: any) => {
      if (!LOG_LEVELS.workflow.enabled) return;
      console.log(formatMessage('workflow', category, message), data ? data : '');
    },
    stigmergy: (message: string, data?: any) => {
      if (!LOG_LEVELS.stigmergy.enabled) return;
      console.log(formatMessage('stigmergy', category, message), data ? data : '');
    },
    coolerScrum: (message: string, data?: any) => {
      if (!LOG_LEVELS.coolertalkscrum.enabled) return;
      console.log(formatMessage('coolertalkscrum', category, message), data ? data : '');
    },
    
    group: (label: string) => console.group(`%c${LOG_LEVELS.info.icon} ${label}`, getStyle('info')),
    groupEnd: () => console.groupEnd(),
    
    time: (label: string) => (console as any).time(`%c${label}`, getStyle('debug')),
    timeEnd: (label: string) => (console as any).timeEnd(`%c${label}`, getStyle('debug')),
  };
}

export const logger = {
  create: createLogger,
  
  info: (category: string, message: string, data?: any) => createLogger(category).info(message, data),
  warn: (category: string, message: string, data?: any) => createLogger(category).warn(message, data),
  error: (category: string, message: string, data?: any) => createLogger(category).error(message, data),
};

export function setupConsoleMonitor() {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  
  originalLog('%c🖥️ Pixel Office Console Monitor', 'color: #20c997; font-size: 16px; font-weight: bold;');
  originalLog('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #495057;');
  originalLog('%c📊 Log Levels: DEBUG | INFO | WARN | ERROR | RENDER | AGENT | NETWORK', 'color: #6c757d; font-size: 11px;');
  originalLog('%c🔍 Enable Debug: localStorage.setItem("pixel_debug", "true")', 'color: #6c757d; font-size: 11px;');
  originalLog('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #495057;');
  
  // Track duplicate-key warnings so we don't spam the console with the
  // same React warning on every render. We still surface the first
  // occurrence for visibility.
  const seenDuplicateKeyWarnings = new Set<string>();

  console.error = (...args: any[]) => {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);

    try {
      const first = args[0];
      if (typeof first === "string" && first.includes("Encountered two children with the same key")) {
        // Normalise out dev-server timestamp query params like ?t=123456
        // so the same warning doesn't appear unique on every reload.
        const normalized = first.replace(/\?t=\d+/g, "?t=");
        const signature = normalized;
        if (seenDuplicateKeyWarnings.has(signature)) {
          return; // suppress repeated duplicate-key warnings
        }
        seenDuplicateKeyWarnings.add(signature);
      }
    } catch {
      // If anything goes wrong, fall back to normal logging below
    }

    originalError(`%c❌ [${timestamp}] ERROR:%c`, 'color: #dc3545; font-weight: bold;', '', ...args);
  };
  
  console.warn = (...args: any[]) => {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
    originalWarn(`%c⚠️ [${timestamp}] WARN:%c`, 'color: #ffc107; font-weight: bold;', '', ...args);
  };
  
  if (typeof window !== 'undefined') {
    (window as any).pixelLogger = logger;
    (window as any).pixelDebug = () => {
      Object.keys(LOG_LEVELS).forEach(key => {
        (LOG_LEVELS as any)[key].enabled = true;
      });
      console.log('%c✅ Debug mode enabled - all logs visible', 'color: #20c997;');
    };
  }
}

export default { createLogger, logger, setupConsoleMonitor };
