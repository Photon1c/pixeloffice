#!/usr/bin/env node
/**
 * Ghost Executive Vacation Mode
 * ------------------------------
 * When the Ghost Executive goes to sleep / is on vacation,
 * the office runs autonomously at maximum productivity.
 *
 * Pipeline: Cooler → SCRUM Candidate → SCRUM Session → Report Export → Agent2Agent review
 *
 * Usage:
 *   const vacation = require('./vacationMode.cjs');
 *   vacation.activate();   // Start autopilot
 *   vacation.deactivate();  // Generate vacation report, stop autopilot
 *   vacation.status();      // Current state
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.resolve(__dirname, '..', 'data');
const VACATION_STATE_FILE = path.join(DATA_DIR, 'vacation_mode.json');
const VACATION_REPORT_DIR = path.join(DATA_DIR, 'vacation_reports');

function ensureDir(d) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}
ensureDir(DATA_DIR);
ensureDir(VACATION_REPORT_DIR);

const CONFIG = {
  API_BASE: process.env.PIXEL_OFFICE_URL || 'http://localhost:4173',
  COOLER_INTERVAL_MS: parseInt(process.env.VACATION_COOLER_INTERVAL || '') || 2 * 60 * 1000,
  SCRUM_INTERVAL_MS: parseInt(process.env.VACATION_SCRUM_INTERVAL || '') || 5 * 60 * 1000,
  CANDIDATE_CHECK_MS: parseInt(process.env.VACATION_CANDIDATE_CHECK || '') || 3 * 60 * 1000,
  REPORT_INTERVAL_MS: parseInt(process.env.VACATION_REPORT_INTERVAL || '') || 30 * 60 * 1000,
};

let state = {
  active: false,
  activatedAt: null,
  deactivatedAt: null,
  stats: {
    coolerSessions: 0,
    scrumSessions: 0,
    scrumCandidatesApproved: 0,
    reportsGenerated: 0,
  },
  lastReportAt: null,
  intervals: {
    cooler: null,
    scrum: null,
    candidate: null,
    report: null,
  },
};

function loadState() {
  try {
    if (fs.existsSync(VACATION_STATE_FILE)) {
      const saved = JSON.parse(fs.readFileSync(VACATION_STATE_FILE, 'utf-8'));
      state = { ...state, ...saved, intervals: { cooler: null, scrum: null, candidate: null, report: null } };
    }
  } catch (e) {
    console.error('[VacationMode] Error loading state:', e.message);
  }
}

function saveState() {
  try {
    const toSave = { ...state };
    toSave.intervals = { cooler: null, scrum: null, candidate: null, report: null };
    fs.writeFileSync(VACATION_STATE_FILE, JSON.stringify(toSave, null, 2));
  } catch (e) {
    console.error('[VacationMode] Error saving state:', e.message);
  }
}

function apiCall(endpoint, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, CONFIG.API_BASE);
    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve({ ok: false, raw: data }); }
      });
    });
    req.on('error', (err) => resolve({ ok: false, error: err.message }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, error: 'timeout' }); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runCoolerCycle() {
  console.log('[VacationMode] Running cooler cycle...');
  const topics = [
    'review recent project updates and identify action items',
    'discuss code quality trends and improvement opportunities',
    'brainstorm new features for the office automation pipeline',
    'analyze current bottlenecks in team workflows',
    'plan next sprint goals and resource allocation',
  ];
  const topic = topics[Math.floor(Math.random() * topics.length)];

  const result = await apiCall('/api/cooler/auto/trigger', 'POST', { topic });
  state.stats.coolerSessions++;
  saveState();
  console.log(`[VacationMode] Cooler session complete: "${topic}"`);
  return result;
}

async function runScrumCycle() {
  console.log('[VacationMode] Running SCRUM cycle...');
  const participants = ['clerk', 'specialist', 'executive', 'archivist'];

  const result = await apiCall('/api/scrum/start', 'POST', {
    topic: `Autonomous planning session #${state.stats.scrumSessions + 1}`,
    participants,
  });
  if (result.session) {
    let session = result.session;
    while (session.finalStatus !== 'complete' && session.finalStatus !== 'failed') {
      const adv = await apiCall('/api/scrum/advance', 'POST');
      session = adv.session || session;
      if (session.finalStatus === 'failed') break;
    }
    state.stats.scrumSessions++;
    saveState();
    console.log(`[VacationMode] SCRUM complete: ${session.id} (${session.finalStatus})`);

    if (session.finalStatus === 'complete') {
      await apiCall('/api/scrum/export', 'POST', { sessionId: session.id, mode: 'localReport' });
    }
  }
  return result;
}

async function checkAndApproveCandidates() {
  console.log('[VacationMode] Checking SCRUM candidates...');
  const result = await apiCall('/api/scrum/candidates?status=pending');
  const candidates = result.candidates || [];
  const highScore = candidates.filter(c => c.score >= 20);
  highScore.sort((a, b) => b.score - a.score);

  if (highScore.length === 0) {
    console.log('[VacationMode] No high-score candidates to approve');
    return;
  }

  const toApprove = highScore.slice(0, 2);
  for (const cand of toApprove) {
    console.log(`[VacationMode] Auto-approving candidate: ${cand.scrumTitle} (score: ${cand.score})`);
    const approveResult = await apiCall(`/api/scrum/candidates/${cand.id}/approve?run=true&export=localReport`, 'POST');
    if (approveResult.ok || approveResult.status === 'completed') {
      state.stats.scrumCandidatesApproved++;
      saveState();
      console.log(`[VacationMode] Approved + ran: ${cand.scrumTitle}`);
    }
  }
}

function generateTimeline(state) {
  const lines = [];
  const sessions = [];
  const candidateDir = path.resolve(DATA_DIR, 'scrum_candidates');
  if (fs.existsSync(candidateDir)) {
    const files = fs.readdirSync(candidateDir).filter(f => f.endsWith('.json'));
    for (const f of files) {
      try {
        const c = JSON.parse(fs.readFileSync(path.join(candidateDir, f), 'utf-8'));
        sessions.push(c);
      } catch (e) { /* skip corrupt */ }
    }
  }
  const approved = sessions.filter(s => s.status === 'approved');
  if (approved.length > 0) {
    lines.push('### Approved SCRUM Candidates');
    for (const s of approved) {
      lines.push(`- **${s.proposed.scrumTitle}** (score: ${s.score}) — approved ${s.approvedAt ? new Date(s.approvedAt).toLocaleString() : '?'}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

async function generateVacationReport() {
  console.log('[VacationMode] Generating vacation report...');
  state.stats.reportsGenerated++;
  state.lastReportAt = new Date().toISOString();
  saveState();

  const activated = state.activatedAt ? new Date(state.activatedAt) : new Date();
  const duration = state.deactivatedAt
    ? Math.round((new Date(state.deactivatedAt) - activated) / 1000 / 60)
    : Math.round((Date.now() - activated.getTime()) / 1000 / 60);

  const report = [
    '# Ghost Executive Vacation Report',
    '',
    `**Generated:** ${new Date().toLocaleString()}`,
    `**Vacation Duration:** ~${duration} minutes`,
    `**Status:** ${state.active ? 'Still on vacation' : 'Returned'}`,
    '',
    '## Summary',
    '',
    `| Activity | Count |`,
    '|----------|-------|',
    `| Cooler Sessions | ${state.stats.coolerSessions} |`,
    `| SCRUM Sessions | ${state.stats.scrumSessions} |`,
    `| SCRUM Candidates Approved | ${state.stats.scrumCandidatesApproved} |`,
    `| Reports Generated | ${state.stats.reportsGenerated} |`,
    '',
  ];

  const timeline = generateTimeline(state);
  if (timeline) {
    report.push('## Activity Timeline');
    report.push('');
    report.push(timeline);
  }

  report.push('## Recent SCRUM Logs');
  report.push('');
  const logDir = path.resolve(DATA_DIR, 'scrum_logs');
  if (fs.existsSync(logDir)) {
    const logs = fs.readdirSync(logDir).filter(f => f.endsWith('.md')).sort().reverse().slice(0, 5);
    for (const log of logs) {
      report.push(`- [${log}](${path.join('../../data/scrum_logs', log)})`);
    }
  }
  report.push('');

  report.push('## Recent Cooler Docs');
  report.push('');
  const coolerDocDir = path.resolve(__dirname, '..', 'docs', 'cooler');
  if (fs.existsSync(coolerDocDir)) {
    const coolers = fs.readdirSync(coolerDocDir).filter(f => f.endsWith('.md') && f !== 'index.md').sort().reverse().slice(0, 10);
    for (const c of coolers) {
      report.push(`- [${c}](docs/cooler/${c})`);
    }
  }
  report.push('');
  report.push('---');
  report.push('_Autogenerated by Pixel Office Ghost Executive Vacation Mode_');

  const filename = `vacation-report-${new Date().toISOString().split('T')[0]}.md`;
  const filepath = path.join(VACATION_REPORT_DIR, filename);
  const content = report.join('\n');
  fs.writeFileSync(filepath, content, 'utf-8');
  console.log(`[VacationMode] Report saved: ${filepath}`);
  return { path: filepath, content };
}

function activate() {
  if (state.active) {
    console.log('[VacationMode] Already active');
    return { ok: true, message: 'Vacation mode already active' };
  }

  loadState();
  state.active = true;
  state.activatedAt = new Date().toISOString();
  state.deactivatedAt = null;

  apiCall('/api/office/night-mode', 'POST', { active: true });
  apiCall('/api/cooler/auto/start', 'POST', {});

  state.intervals.cooler = setInterval(runCoolerCycle, CONFIG.COOLER_INTERVAL_MS);
  state.intervals.scrum = setInterval(runScrumCycle, CONFIG.SCRUM_INTERVAL_MS);
  state.intervals.candidate = setInterval(checkAndApproveCandidates, CONFIG.CANDIDATE_CHECK_MS);
  state.intervals.report = setInterval(generateVacationReport, CONFIG.REPORT_INTERVAL_MS);

  runCoolerCycle();
  runScrumCycle();
  checkAndApproveCandidates();

  saveState();
  console.log(`[VacationMode] ACTIVATED — office on autopilot (cooler: ${CONFIG.COOLER_INTERVAL_MS/1000}s, scrum: ${CONFIG.SCRUM_INTERVAL_MS/1000}s, candidate check: ${CONFIG.CANDIDATE_CHECK_MS/1000}s)`);
  return { ok: true, message: 'Vacation mode activated. Office is on autopilot.' };
}

async function deactivate() {
  if (!state.active) {
    console.log('[VacationMode] Not active');
    return { ok: true, message: 'Not in vacation mode' };
  }

  state.active = false;
  state.deactivatedAt = new Date().toISOString();

  Object.entries(state.intervals).forEach(([key, timer]) => {
    if (timer) { clearInterval(timer); state.intervals[key] = null; }
  });

  apiCall('/api/office/night-mode', 'POST', { active: false });
  apiCall('/api/cooler/auto/stop', 'POST', {});

  const report = await generateVacationReport();
  saveState();

  console.log('[VacationMode] DEACTIVATED — office returning to normal hours');
  return { ok: true, message: 'Vacation mode deactivated', report };
}

function status() {
  return {
    active: state.active,
    activatedAt: state.activatedAt,
    deactivatedAt: state.deactivatedAt,
    stats: state.stats,
    config: CONFIG,
  };
}

function getReport() {
  const reports = fs.readdirSync(VACATION_REPORT_DIR).filter(f => f.endsWith('.md')).sort().reverse();
  if (reports.length === 0) return null;
  const latest = reports[0];
  const content = fs.readFileSync(path.join(VACATION_REPORT_DIR, latest), 'utf-8');
  return { filename: latest, content };
}

loadState();

module.exports = { activate, deactivate, status, generateVacationReport, getReport, CONFIG };
