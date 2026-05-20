#!/usr/bin/env node
/**
 * Pixel Office Agent Orchestrator
 * ------------------------------
 * Runs scheduled and random agent activities so when you wake up,
 * there's activity and progress reports.
 * 
 * Uses local small models (gemma3:270m, qwen:0.5b) by default.
 * 
 * Agentic OS Kernel: Planner → Actuator → Evaluator → Reflector loop
 * for autonomous reasoning and task execution.
 * 
 * Usage:
 *   node orchestrator.js --start           # Start the orchestrator
 *   node orchestrator.js --status           # Show status
 *   node orchestrator.js --runnow           # Run one cycle immediately
 *   node orchestrator.js --kernel "goal"    # Run kernel reasoning loop
 *   node orchestrator.js --stop             # Stop orchestrator
 */

const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  API_BASE: process.env.PIXEL_OFFICE_URL || 'http://localhost:4173',
  PRIMARY_MODEL: 'gemma3:270m',
  FALLBACK_MODEL: 'qwen:0.5b',
  SCHEDULE_INTERVAL_MS: 15 * 60 * 1000,  // 15 min
  RANDOM_INTERVAL_MS: 5 * 60 * 1000,       // 5 min random bursts
  KERNEL_INTERVAL_MS: 30 * 60 * 1000,      // 30 min for kernel cycles
  REPORT_FILE: '/home/sherlockhums/apps/pixelworld/pixel_office/data/orchestrator_report.json',
  LOG_FILE: '/home/sherlockhums/apps/pixelworld/pixel_office/data/orchestrator.log',
  PID_FILE: '/home/sherlockhums/apps/pixelworld/pixel_office/data/orchestrator.pid',
  KERNEL_REPORT_FILE: '/home/sherlockhums/apps/pixelworld/pixel_office/data/kernel_report.json',
};

const AGENT_ROLES = ['clerk', 'specialist', 'custodian', 'thought_loop'];
const TOPICS = [
  'review recent project updates',
  'check team communication',
  'analyze code quality trends',
  'generate idea for office improvement',
  'write a quick progress note',
  'coordinate with other agent',
];

const KERNEL_GOALS = [
  'Review office health metrics and suggest improvements',
  'Check for pending SCRUM candidates and promote if needed',
  'Analyze agent activity patterns and report anomalies',
  'Update news topics and trigger cooler sessions',
  'Check desk stigmergy state and identify hotspots',
];

const VACATION_KERNEL_GOALS = [
  'Run a full autonomous cooler session to generate new ideas and capture stigmergy residue',
  'Approve the highest-scoring pending SCRUM candidates and run full sessions',
  'Generate a comprehensive office activity report with stigmergy field analysis',
  'Check all agent health and trigger Agent2Agent peer reviews for any stale agents',
  'Run a strategic planning session covering backlog, dependencies, and next priorities',
  'Analyze recent cooler transcripts and promote actionable items to SCRUM candidates',
  'Check desk stigmergy state and identify hotspots requiring attention',
  'Generate a vacation report segment summarizing recent autonomous activity',
];

let isRunning = false;
let scheduleTimer = null;
let randomTimer = null;
let kernelTimer = null;
let lastReport = null;
let kernelMemory = null;

function log(msg, level = 'INFO') {
  const ts = new Date().toISOString();
  const line = `[${ts}] [${level}] ${msg}\n`;
  fs.appendFileSync(CONFIG.LOG_FILE, line);
  console.log(line.trim());
}

function saveReport(report) {
  lastReport = report;
  fs.writeFileSync(CONFIG.REPORT_FILE, JSON.stringify(report, null, 2));
}

function saveKernelReport(report) {
  fs.writeFileSync(CONFIG.KERNEL_REPORT_FILE, JSON.stringify(report, null, 2));
}

function apiCall(endpoint, method = 'GET', body = null) {
  return new Promise((resolve) => {
    const url = new URL(endpoint, CONFIG.API_BASE);
    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
    };
    
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, data });
        }
      });
    });
    
    req.on('error', () => resolve({ ok: false }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false }); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function checkVacationMode() {
  try {
    const result = await apiCall('/api/office/vacation-mode/status');
    return result && result.active === true;
  } catch {
    return false;
  }
}

async function callOllama(model, prompt, numPredict = 128) {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      model,
      prompt,
      stream: false,
      options: { num_predict: numPredict, temperature: 0.7 }
    });
    
    const req = http.request({
      hostname: '127.0.0.1',
      port: 11434,
      path: '/api/generate',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
      timeout: 30000,
    }, (res) => {
      let result = '';
      res.on('data', chunk => result += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(result);
          resolve(parsed.response || '');
        } catch {
          resolve('');
        }
      });
    });
    
    req.on('error', () => resolve(''));
    req.on('timeout', () => { req.destroy(); resolve(''); });
    req.write(data);
    req.end();
  });
}

// ========== Kernel Memory ==========
function loadKernelMemory() {
  const MEMORY_FILE = path.join(path.dirname(CONFIG.LOG_FILE), 'kernel_memory.json');
  try {
    if (fs.existsSync(MEMORY_FILE)) {
      return JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf-8'));
    }
  } catch {}
  return { episodic: [], semantic: { facts: [], rules: [] }, working: {} };
}

function saveKernelMemory(memory) {
  const MEMORY_FILE = path.join(path.dirname(CONFIG.LOG_FILE), 'kernel_memory.json');
  try {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2));
  } catch (err) {
    log('Failed to save kernel memory: ' + err.message, 'ERROR');
  }
}

function addMemoryEpisode(memory, event) {
  memory.episodic.push({ ...event, timestamp: new Date().toISOString() });
  if (memory.episodic.length > 100) memory.episodic = memory.episodic.slice(-100);
  saveKernelMemory(memory);
}

function getMemoryContext(memory) {
  const recent = memory.episodic.slice(-5).map(e => e.description).join('; ');
  const facts = memory.semantic?.facts?.slice(-3).join('; ') || '';
  return `Recent: ${recent || 'none'}. Facts: ${facts || 'none'}.`;
}

// ========== Kernel Components ==========
const TOOL_MAP = {
  'run_cooler': 'run_cooler',
  'list_scrum': 'list_scrum',
  'approve_scrum': 'approve_scrum',
  'refresh_news': 'refresh_news',
  'health_check': 'health_check',
  'desk_state': 'desk_state',
  'write_note': 'write_note',
};

function parseTasksFromResponse(response) {
  const match = response.match(/\{[\s\S]*\}/);
  if (!match) return null;
  
  try {
    const parsed = JSON.parse(match[0]);
    if (parsed.tasks && Array.isArray(parsed.tasks)) {
      return parsed.tasks.map(t => {
        const toolName = Object.keys(TOOL_MAP).find(key => 
          (t.tool || t.description || '').toLowerCase().includes(key.replace('_', ' ')) ||
          (t.tool || t.description || '').toLowerCase().includes(key.replace('_', ''))
        ) || 'write_note';
        return {
          id: t.id || 'task_' + Math.random().toString(36).slice(2, 6),
          description: t.description || t.tool || 'Default task',
          tool: toolName,
          params: t.params || {}
        };
      });
    }
  } catch {}
  return null;
}

async function kernelPlanner(model, goal, memory) {
  const context = getMemoryContext(memory);
  const tools = Object.entries(TOOL_MAP).map(([id, _]) => `- ${id}: ${id.replace('_', ' ')}`).join('\n');

  const prompt = `[INST] Break this goal into tasks using available tools.
Context: ${context}
Goal: ${goal}
Available tools:
${tools}
Respond JSON with tasks array, each task needs: id, description, tool (use tool id from list above).[/INST]`;

  try {
    const response = await callOllama(model, prompt, 256);
    const tasks = parseTasksFromResponse(response);
    if (tasks && tasks.length > 0) {
      log('[Planner] Generated ' + tasks.length + ' tasks');
      return tasks;
    }
  } catch (err) {
    log('[Planner] Error: ' + err.message, 'ERROR');
  }

  return [
    { id: 't1', description: 'Check health metrics', tool: 'health_check', params: {} },
    { id: 't2', description: 'List pending SCRUM candidates', tool: 'list_scrum', params: {} }
  ];
}

async function kernelActuator(tool, params, memory) {
  let result = { success: false, output: null, error: null };

  try {
    switch (tool) {
      case 'run_cooler':
        result = { success: true, output: 'Cooler session triggered' };
        await apiCall('/api/cooler/topics/refresh', 'POST');
        break;
      case 'list_scrum':
        const resp = await apiCall('/api/scrum/candidates?status=pending');
        result = { success: true, output: resp };
        break;
      case 'approve_scrum':
        if (params.candidateId) {
          const r = await apiCall(`/api/scrum/candidates/${params.candidateId}/approve?run=true`, 'POST');
          result = { success: r.ok, output: r };
        } else {
          result = { success: false, error: 'No candidate ID' };
        }
        break;
      case 'refresh_news':
        await apiCall('/api/cooler/topics/refresh', 'POST');
        result = { success: true, output: 'News refreshed' };
        break;
      case 'health_check':
        result = { success: true, output: 'Health metrics available at /metrics' };
        break;
      case 'desk_state':
        const dr = await apiCall('/api/stigmergy/desk/all');
        result = { success: true, output: dr };
        break;
      case 'write_note':
        memory.semantic = memory.semantic || { facts: [], rules: [] };
        memory.semantic.facts = memory.semantic.facts || [];
        memory.semantic.facts.push('NOTE: ' + params.content);
        result = { success: true, output: 'Note saved' };
        break;
      default:
        result = { success: false, error: 'Unknown tool: ' + tool };
    }
  } catch (err) {
    result = { success: false, error: err.message };
  }

  addMemoryEpisode(memory, { task: tool, success: result.success, output: String(result.output)?.slice(0, 100) });
  return result;
}

async function kernelEvaluator(task, result) {
  if (!result.success) {
    return { passed: false, confidence: 0, reason: result.error || 'Failed' };
  }
  return { passed: true, confidence: 0.7, reason: 'Task completed successfully' };
}

async function kernelReflector(goal, iteration, results, memory) {
  const MAX_ITERATIONS = 5;
  const CONFIDENCE_THRESHOLD = 0.7;

  const avgConf = results.length > 0
    ? results.reduce((a, r) => a + (r.evaluation?.confidence || 0), 0) / results.length
    : 0;

  if (iteration >= MAX_ITERATIONS) {
    return { shouldContinue: false, reason: 'max_iterations', decision: 'exit' };
  }

  if (avgConf >= CONFIDENCE_THRESHOLD) {
    return { shouldContinue: false, reason: 'confidence_met', decision: 'exit' };
  }

  const context = getMemoryContext(memory);
  const failedTasks = results.filter(r => !r.evaluation?.passed).map(r => r.task?.description).join('; ');

  const prompt = `[INST] Loop decision for: "${goal}"
Iteration: ${iteration}/${MAX_ITERATIONS}, Confidence: ${avgConf.toFixed(2)}, Failed: ${failedTasks || 'none'}
Context: ${context}
Respond JSON with shouldContinue (boolean), reason (string), decision (continue/exit).[/INST]`;

  try {
    const response = await callOllama(CONFIG.PRIMARY_MODEL, prompt, 128);
    const match = response.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (typeof parsed.shouldContinue === 'boolean') {
        return parsed;
      }
    }
  } catch (err) {
    log('[Reflector] Parse error: ' + err.message, 'ERROR');
  }

  return { shouldContinue: iteration < 2, reason: 'default', decision: iteration < 2 ? 'continue' : 'exit' };
}

// ========== Kernel Reasoning Loop ==========
async function runKernelCycle(goal = null) {
  kernelMemory = loadKernelMemory();

  const isVacation = await checkVacationMode();

  if (!goal) {
    const pool = isVacation ? VACATION_KERNEL_GOALS : KERNEL_GOALS;
    goal = pool[Math.floor(Math.random() * pool.length)];
  }

  if (isVacation) {
    log('[Kernel] Vacation mode detected - using enhanced goal set');
  }

  log('=== Kernel Reasoning Loop STARTING ===');
  log('Goal: ' + goal);

  const kernelReport = {
    stimulus: goal,
    timestamp: new Date().toISOString(),
    iterations: [],
    finalDecision: null,
    success: false,
  };

  let iteration = 0;
  let results = [];

  while (true) {
    iteration++;
    log('\n--- Iteration ' + iteration + ' ---');

    const tasks = await kernelPlanner(CONFIG.PRIMARY_MODEL, goal, kernelMemory);
    kernelReport.iterations.push({ iteration, tasks: tasks.map(t => t.description), results: [] });

    for (const task of tasks) {
      const result = await kernelActuator(task.tool, task.params || {}, kernelMemory);
      const evaluation = await kernelEvaluator(task, result);
      results.push({ task, result, evaluation });
      log('  Task "' + task.description + '": ' + (result.success ? 'OK' : 'FAIL') + ' (conf: ' + evaluation.confidence.toFixed(2) + ')');
    }

    const reflection = await kernelReflector(goal, iteration, results, kernelMemory);
    kernelReport.finalDecision = reflection.decision;
    saveKernelMemory(kernelMemory);

    if (!reflection.shouldContinue) {
      log('Reflector: ' + reflection.decision + ' - ' + reflection.reason);
      break;
    }
  }

  const avgConf = results.length > 0
    ? results.reduce((a, r) => a + (r.evaluation?.confidence || 0), 0) / results.length
    : 0;

  kernelReport.success = kernelReport.finalDecision === 'exit' && avgConf >= 0.5;
  kernelReport.avgConfidence = avgConf;

  log('\n=== Kernel Reasoning Loop COMPLETE ===');
  log('Decision: ' + kernelReport.finalDecision + ', Confidence: ' + avgConf.toFixed(2));

  saveKernelReport(kernelReport);
  return kernelReport;
}

// ========== Standard Agent Cycles (existing) ==========
async function runAgentCycle(activityType = 'scheduled') {
  const isVacation = await checkVacationMode();
  
  const report = {
    timestamp: new Date().toISOString(),
    activity: activityType,
    agents: [],
    models: { primary: CONFIG.PRIMARY_MODEL, fallback: CONFIG.FALLBACK_MODEL },
    actions: [],
  };
  
  log(`Starting ${activityType} cycle...${isVacation ? ' [VACATION MODE]' : ''}`);
  
  for (const role of AGENT_ROLES) {
    const model = Math.random() > 0.5 ? CONFIG.PRIMARY_MODEL : CONFIG.FALLBACK_MODEL;
    const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    
    try {
      const prompt = `[Role: ${role}] ${topic}. Write 1-2 sentences as a ${role} in the Pixel Office.`;
      const response = await callOllama(model, prompt);
      
      report.agents.push({ role, model, topic, response: response.slice(0, 200) });
      report.actions.push({ role, action: topic, success: true });
      
      log(`[${role}] ${topic}: ${response.slice(0, 80)}...`);
    } catch (err) {
      report.agents.push({ role, model, topic, error: err.message });
      report.actions.push({ role, action: topic, success: false });
      log(`[${role}] Failed: ${err.message}`, 'ERROR');
    }
  }
  
  // Agent-to-agent checkins (always happens in vacation mode)
  const doCheckin = isVacation || activityType === 'random' || Math.random() > 0.5;
  if (doCheckin) {
    const numPairs = isVacation ? 2 : 1;
    for (let ci = 0; ci < numPairs; ci++) {
      const agentA = AGENT_ROLES[Math.floor(Math.random() * AGENT_ROLES.length)];
      let agentB = AGENT_ROLES[Math.floor(Math.random() * AGENT_ROLES.length)];
      while (agentB === agentA) agentB = AGENT_ROLES[Math.floor(Math.random() * AGENT_ROLES.length)];
      
      try {
        const a2aTopics = [
          `"Hey ${agentB}! What are you working on?"`,
          `"${agentB}, I noticed something interesting about the latest cooler session — what's your take?"`,
          `"${agentB}, any blockers I should know about for the next SCRUM?"`,
          `"${agentB}, let's sync on the stigmergy hotspots I'm seeing in the office."`,
        ];
        const topic = a2aTopics[Math.floor(Math.random() * a2aTopics.length)];
        const prompt = `Agent ${agentA} is checking in with ${agentB}. ${agentA}: ${topic} Write ${agentB}'s response (brief, 1 sentence).`;
        const response = await callOllama(CONFIG.PRIMARY_MODEL, prompt);
        
        report.actions.push({ type: 'checkin', from: agentA, to: agentB, response: response.slice(0, 150) });
        log(`Checkin: ${agentA} -> ${agentB}: ${response.slice(0, 60)}...`);
      } catch (err) {
        log(`Checkin failed: ${err.message}`, 'ERROR');
      }
    }
  }
  
  saveReport(report);
  log(`Cycle complete: ${report.actions.filter(a => a.success).length}/${report.actions.length} actions succeeded`);
  
  return report;
}

function start() {
  if (isRunning) {
    log('Orchestrator already running');
    return;
  }
  
  // Save PID
  fs.writeFileSync(CONFIG.PID_FILE, process.pid.toString());
  
  isRunning = true;
  log('=== Pixel Office Orchestrator STARTED ===');
  log(`Primary model: ${CONFIG.PRIMARY_MODEL}`);
  log(`Fallback model: ${CONFIG.FALLBACK_MODEL}`);
  
  checkVacationMode().then(isVacation => {
    const scheduleInterval = isVacation ? Math.floor(CONFIG.SCHEDULE_INTERVAL_MS * 0.5) : CONFIG.SCHEDULE_INTERVAL_MS;
    const randomInterval = isVacation ? Math.floor(CONFIG.RANDOM_INTERVAL_MS * 0.5) : CONFIG.RANDOM_INTERVAL_MS;
    const kernelInterval = isVacation ? Math.floor(CONFIG.KERNEL_INTERVAL_MS * 0.5) : CONFIG.KERNEL_INTERVAL_MS;
    
    log(`Schedule: Every ${scheduleInterval / 60000}min + random every ${randomInterval / 60000}min`);
    log(`Kernel: Every ${kernelInterval / 60000}min`);
    if (isVacation) log('[Orchestrator] Vacation mode active - intervals doubled for maximum productivity');
    
    // Scheduled runs
    scheduleTimer = setInterval(() => runAgentCycle('scheduled'), scheduleInterval);
    
    // Random bursts
    const scheduleRandom = () => {
      if (!isRunning) return;
      runAgentCycle('random').then(() => {
        randomTimer = setTimeout(scheduleRandom, randomInterval);
      });
    };
    randomTimer = setTimeout(scheduleRandom, randomInterval + Math.random() * 60000);
    
    // Kernel reasoning cycles
    kernelTimer = setInterval(() => runKernelCycle(), kernelInterval);
  });
  
  // Initial run - both agent cycle and kernel
  runAgentCycle('startup');
  runKernelCycle();
}

function stop() {
  isRunning = false;
  if (scheduleTimer) clearInterval(scheduleTimer);
  if (randomTimer) clearTimeout(randomTimer);
  if (kernelTimer) clearInterval(kernelTimer);
  scheduleTimer = null;
  randomTimer = null;
  kernelTimer = null;
  
  if (fs.existsSync(CONFIG.PID_FILE)) fs.unlinkSync(CONFIG.PID_FILE);
  
  log('=== Pixel Office Orchestrator STOPPED ===');
}

function status() {
  if (fs.existsSync(CONFIG.PID_FILE)) {
    const pid = fs.readFileSync(CONFIG.PID_FILE, 'utf-8').trim();
    console.log(`Orchestrator running: PID ${pid}`);
  } else {
    console.log('Orchestrator not running');
  }
  
  if (lastReport) {
    console.log(`\nLast agent report (${lastReport.timestamp}):`);
    console.log(`  Activity: ${lastReport.activity}`);
    console.log(`  Actions: ${lastReport.actions.length}`);
  }
  
  try {
    if (fs.existsSync(CONFIG.KERNEL_REPORT_FILE)) {
      const kernelReport = JSON.parse(fs.readFileSync(CONFIG.KERNEL_REPORT_FILE, 'utf-8'));
      console.log(`\nLast kernel report (${kernelReport.timestamp}):`);
      console.log(`  Goal: ${kernelReport.stimulus}`);
      console.log(`  Decision: ${kernelReport.finalDecision}`);
      console.log(`  Iterations: ${kernelReport.iterations.length}`);
      console.log(`  Success: ${kernelReport.success}`);
    }
  } catch {}
}

// CLI
const args = process.argv.slice(2);
if (args.includes('--start')) {
  start();
} else if (args.includes('--stop')) {
  stop();
} else if (args.includes('--status')) {
  status();
} else if (args.includes('--runnow')) {
  runAgentCycle('manual');
} else if (args.includes('--kernel')) {
  const goal = args.slice(args.indexOf('--kernel') + 1).join(' ') || null;
  runKernelCycle(goal).then(report => {
    console.log('\n=== KERNEL REPORT ===');
    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
  });
} else {
  console.log(`
Pixel Office Agent Orchestrator
Usage:
  node orchestrator.js --start      Start the orchestrator (runs in background)
  node orchestrator.js --stop       Stop the orchestrator
  node orchestrator.js --status     Show status
  node orchestrator.js --runnow     Run one agent cycle immediately
  node orchestrator.js --kernel     Run kernel reasoning loop
  node orchestrator.js --kernel "goal"   Run kernel with specific goal

Environment:
  PIXEL_OFFICE_URL     API base URL (default: http://localhost:4173)
`);
}

process.on('SIGINT', () => { stop(); process.exit(); });
process.on('SIGTERM', () => { stop(); process.exit(); });

module.exports = { start, stop, runAgentCycle };