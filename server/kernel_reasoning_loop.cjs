#!/usr/bin/env node
/**
 * Agentic OS Kernel Reasoning Loop
 * --------------------------------
 * Implements the Planner → Actuator → Evaluator → Reflector loop
 * for autonomous agent execution in Pixel Office.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const DATA_DIR = 'process.cwd()/data';
const MEMORY_FILE = path.join(DATA_DIR, 'kernel_memory.json');

const CONFIG = {
  API_BASE: process.env.PIXEL_OFFICE_URL || 'http://localhost:4173',
  PRIMARY_MODEL: 'gemma3:270m',
  FALLBACK_MODEL: 'qwen:0.5b',
  CONFIDENCE_THRESHOLD: 0.7,
  MAX_ITERATIONS: 5,
  MAX_TOOLS_PER_TASK: 10,
};

const TOOLS = {
  cooler_run: { name: 'run_cooler_session', description: 'Run a cooler talk session with agents', params: ['topic', 'participants'] },
  scrum_approve: { name: 'approve_scrum_candidate', description: 'Approve a SCRUM candidate', params: ['candidateId', 'run'] },
  scrum_list: { name: 'list_scrum_candidates', description: 'List pending SCRUM candidates', params: ['status'] },
  news_refresh: { name: 'refresh_news_topics', description: 'Refresh news topics', params: [] },
  health_check: { name: 'get_health_metrics', description: 'Get system health metrics', params: [] },
  desk_stigmergy: { name: 'get_desk_stigmergy', description: 'Get desk stigmergy state', params: [] },
  write_note: { name: 'write_progress_note', description: 'Write a note to the office log', params: ['content'] },
  llm_inference: { name: 'llm_inference', description: 'Run inference with local LLM', params: ['prompt', 'model'] },
};

function log(msg, level = 'INFO') {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [${level}] ${msg}`);
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
    
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function callOllama(model, prompt, numPredict = 128) {
  return new Promise((resolve, reject) => {
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
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
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
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

class KernelMemory {
  constructor() {
    this.episodic = [];
    this.semantic = { facts: [], rules: [] };
    this.working = { context: {}, activeGoals: [] };
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(MEMORY_FILE)) {
        const data = JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf-8'));
        this.episodic = data.episodic || [];
        this.semantic = data.semantic || { facts: [], rules: [] };
        this.working = data.working || { context: {}, activeGoals: [] };
        log('Memory loaded: ' + this.episodic.length + ' episodes');
      }
    } catch (err) {
      log('Memory load error: ' + err.message, 'WARN');
    }
  }

  save() {
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(MEMORY_FILE, JSON.stringify({
        episodic: this.episodic,
        semantic: this.semantic,
        working: this.working,
        savedAt: new Date().toISOString()
      }, null, 2));
    } catch (err) {
      log('Memory save error: ' + err.message, 'ERROR');
    }
  }

  addEpisode(event) {
    this.episodic.push({ ...event, timestamp: new Date().toISOString() });
    if (this.episodic.length > 100) this.episodic = this.episodic.slice(-100);
    this.save();
  }

  addFact(fact) {
    this.semantic.facts.push(fact);
    if (this.semantic.facts.length > 50) this.semantic.facts = this.semantic.facts.slice(-50);
    this.save();
  }

  setWorkingContext(ctx) {
    this.working.context = { ...this.working.context, ...ctx };
    this.save();
  }

  getContextSummary() {
    const recent = this.episodic.slice(-5).map(e => e.description).join('; ');
    const facts = this.semantic.facts.slice(-3).join('; ');
    const goals = this.working.activeGoals.join('; ');
    return `Recent: ${recent || 'none'}. Facts: ${facts || 'none'}. Goals: ${goals || 'none'}.`;
  }
}

class Planner {
  constructor(memory, model) {
    this.memory = memory;
    this.model = model;
  }

  async decompose(goal) {
    const context = this.memory.getContextSummary();
    const toolsList = Object.entries(TOOLS).map(([id, t]) => `- ${id}: ${t.description}`).join('\n');
    
    const prompt = `[INST] Given a goal and available tools, decompose into sub-tasks.
Context: ${context}
Goal: ${goal}
Available tools:
${toolsList}
Respond in JSON format:
{
  "tasks": [{"id": "task1", "description": "...", "tool": "tool_id", "params": {...}, "priority": 1-5}],
  "reasoning": "why this decomposition"
}[/INST]`;

    try {
      const response = await callOllama(this.model, prompt, 256);
      const parsed = this.parseJsonResponse(response);
      if (parsed && parsed.tasks) {
        log('Planned ' + parsed.tasks.length + ' sub-tasks');
        return parsed;
      }
    } catch (err) {
      log('Planner error: ' + err.message, 'ERROR');
    }
    
    return { tasks: [{ id: 'default', description: goal, tool: 'llm_inference', params: { prompt: goal }, priority: 1 }], reasoning: 'fallback' };
  }

  parseJsonResponse(text) {
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
    } catch {}
    return null;
  }
}

class Actuator {
  constructor(memory, model) {
    this.memory = memory;
    this.model = model;
    this.executionCount = 0;
  }

  async execute(task) {
    this.executionCount++;
    const startTime = Date.now();
    let result = { success: false, output: null, error: null };

    log('Executing: ' + task.description + ' via ' + task.tool);

    try {
      switch (task.tool) {
        case 'run_cooler_session':
          result = await this.runCoolerSession(task.params);
          break;
        case 'approve_scrum_candidate':
          result = await this.approveScrumCandidate(task.params);
          break;
        case 'list_scrum_candidates':
          result = await this.listScrumCandidates(task.params);
          break;
        case 'refresh_news_topics':
          result = await this.refreshNewsTopics();
          break;
        case 'get_health_metrics':
          result = await this.getHealthMetrics();
          break;
        case 'get_desk_stigmergy':
          result = await this.getDeskStigmergy();
          break;
        case 'write_note':
          result = await this.writeProgressNote(task.params);
          break;
        case 'llm_inference':
          result = await this.runLlmInference(task.params);
          break;
        default:
          result = { success: false, output: null, error: 'Unknown tool: ' + task.tool };
      }
    } catch (err) {
      result = { success: false, output: null, error: err.message };
    }

    const duration = Date.now() - startTime;
    this.memory.addEpisode({
      taskId: task.id,
      description: task.description,
      tool: task.tool,
      success: result.success,
      duration,
      output: result.output ? String(result.output).slice(0, 200) : null
    });

    return result;
  }

  async runCoolerSession(params) {
    try {
      const resp = await apiCall('/api/cooler/topics/refresh', 'POST');
      return { success: true, output: resp };
    } catch (err) {
      return { success: false, output: null, error: err.message };
    }
  }

  async approveScrumCandidate(params) {
    try {
      const id = params.candidateId;
      if (!id) return { success: false, output: null, error: 'No candidate ID' };
      const resp = await apiCall(`/api/scrum/candidates/${id}/approve?run=true`, 'POST');
      return { success: resp.ok, output: resp };
    } catch (err) {
      return { success: false, output: null, error: err.message };
    }
  }

  async listScrumCandidates(params) {
    try {
      const status = params.status || 'pending';
      const resp = await apiCall(`/api/scrum/candidates?status=${status}`);
      return { success: true, output: resp };
    } catch (err) {
      return { success: false, output: null, error: err.message };
    }
  }

  async refreshNewsTopics() {
    try {
      const resp = await apiCall('/api/cooler/topics/refresh', 'POST');
      return { success: true, output: resp };
    } catch (err) {
      return { success: false, output: null, error: err.message };
    }
  }

  async getHealthMetrics() {
    try {
      const resp = await apiCall('/metrics');
      return { success: true, output: 'Metrics available at /metrics' };
    } catch (err) {
      return { success: false, output: null, error: err.message };
    }
  }

  async getDeskStigmergy() {
    try {
      const resp = await apiCall('/api/stigmergy/desk/all');
      return { success: true, output: resp };
    } catch (err) {
      return { success: false, output: null, error: err.message };
    }
  }

  async writeProgressNote(params) {
    try {
      this.memory.addFact('NOTE: ' + params.content);
      return { success: true, output: 'Note saved: ' + params.content };
    } catch (err) {
      return { success: false, output: null, error: err.message };
    }
  }

  async runLlmInference(params) {
    try {
      const response = await callOllama(this.model, params.prompt, params.numPredict || 128);
      return { success: true, output: response };
    } catch (err) {
      return { success: false, output: null, error: err.message };
    }
  }
}

class Evaluator {
  constructor(memory, model) {
    this.memory = memory;
    this.model = model;
  }

  async evaluate(task, result) {
    if (!result.success) {
      return { passed: false, confidence: 0, reason: 'Execution failed: ' + result.error, suggestions: [] };
    }

    const context = this.memory.getContextSummary();
    const prompt = `[INST] Evaluate if this task result meets the goal.
Task: ${task.description}
Result: ${JSON.stringify(result.output)?.slice(0, 200) || 'Success'}
Context: ${context}
Respond in JSON: {"passed": true/false, "confidence": 0.0-1.0, "reason": "...", "suggestions": ["..."]}[/INST]`;

    try {
      const response = await callOllama(this.model, prompt, 128);
      const parsed = this.parseJsonResponse(response);
      if (parsed) {
        return parsed;
      }
    } catch (err) {
      log('Evaluator error: ' + err.message, 'ERROR');
    }

    return { passed: result.success, confidence: 0.5, reason: 'Auto-pass due to no failure', suggestions: [] };
  }

  parseJsonResponse(text) {
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
    } catch {}
    return null;
  }
}

class Reflector {
  constructor(memory, model) {
    this.memory = memory;
    this.model = model;
    this.iterationCount = 0;
  }

  async shouldContinue(goal, iteration, results, avgConfidence) {
    this.iterationCount = iteration;

    if (iteration >= CONFIG.MAX_ITERATIONS) {
      log('Max iterations reached (' + CONFIG.MAX_ITERATIONS + ')');
      return { shouldContinue: false, reason: 'max_iterations', decision: 'exit' };
    }

    if (avgConfidence >= CONFIG.CONFIDENCE_THRESHOLD) {
      log('Goal confidence met (' + avgConfidence.toFixed(2) + ' >= ' + CONFIG.CONFIDENCE_THRESHOLD + ')');
      return { shouldContinue: false, reason: 'confidence_threshold_met', decision: 'exit' };
    }

    const context = this.memory.getContextSummary();
    const failedTasks = results.filter(r => !r.evaluation.passed).map(r => r.task.description).join('; ');

    const prompt = `[INST] Should the reasoning loop continue?
Goal: ${goal}
Iteration: ${iteration}/${CONFIG.MAX_ITERATIONS}
Avg confidence: ${avgConfidence.toFixed(2)} (threshold: ${CONFIG.CONFIDENCE_THRESHOLD})
Failed tasks: ${failedTasks || 'none'}
Context: ${context}
Respond in JSON: {"shouldContinue": true/false, "reason": "...", "nextSteps": ["..."], "decision": "continue/exit/replan"}[/INST]`;

    try {
      const response = await callOllama(this.model, prompt, 128);
      const parsed = this.parseJsonResponse(response);
      if (parsed) {
        log('Reflector decision: ' + parsed.decision + ' - ' + parsed.reason);
        return parsed;
      }
    } catch (err) {
      log('Reflector error: ' + err.message, 'ERROR');
    }

    return { shouldContinue: true, reason: 'unknown', nextSteps: ['continue current plan'], decision: 'continue' };
  }

  parseJsonResponse(text) {
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
    } catch {}
    return null;
  }
}

class AgenticOSKernel {
  constructor(model = CONFIG.PRIMARY_MODEL) {
    this.memory = new KernelMemory();
    this.planner = new Planner(this.memory, model);
    this.actuator = new Actuator(this.memory, model);
    this.evaluator = new Evaluator(this.memory, model);
    this.reflector = new Reflector(this.memory, model);
    this.model = model;
  }

  async run(stimulus) {
    const runReport = {
      stimulus,
      timestamp: new Date().toISOString(),
      model: this.model,
      iterations: [],
      finalDecision: null,
      success: false,
    };

    log('=== Agentic OS Kernel STARTING ===');
    log('Stimulus: ' + stimulus);

    this.memory.working.activeGoals = [stimulus];
    this.memory.setWorkingContext({ lastStimulus: stimulus, lastRun: new Date().toISOString() });

    let iteration = 0;
    let allResults = [];
    let avgConfidence = 0;

    while (true) {
      iteration++;
      const iterReport = { iteration, tasks: [] };

      log('\n--- Iteration ' + iteration + ' ---');

      const plan = await this.planner.decompose(stimulus);
      iterReport.plan = plan;

      for (const task of plan.tasks || []) {
        log('  -> Task: ' + task.description);
        const result = await this.actuator.execute(task);
        const evaluation = await this.evaluator.evaluate(task, result);
        log('  <- Result: ' + (result.success ? 'OK' : 'FAIL') + ', Confidence: ' + (evaluation.confidence || 0).toFixed(2));

        allResults.push({ task, result, evaluation });
        iterReport.tasks.push({
          taskId: task.id,
          description: task.description,
          success: result.success,
          confidence: evaluation.confidence || 0,
        });
      }

      const validConfidences = iterReport.tasks.map(t => t.confidence).filter(c => c > 0);
      avgConfidence = validConfidences.length > 0
        ? validConfidences.reduce((a, b) => a + b, 0) / validConfidences.length
        : 0;

      iterReport.avgConfidence = avgConfidence;
      runReport.iterations.push(iterReport);

      const reflection = await this.reflector.shouldContinue(stimulus, iteration, allResults, avgConfidence);
      runReport.finalDecision = reflection.decision;

      log('Reflection: ' + reflection.decision + ' (' + reflection.reason + ')');

      if (!reflection.shouldContinue) {
        runReport.success = reflection.decision !== 'exit' || avgConfidence >= CONFIG.CONFIDENCE_THRESHOLD;
        break;
      }

      if (reflection.nextSteps && reflection.nextSteps.length > 0) {
        stimulus = reflection.nextSteps[0];
      }
    }

    log('\n=== Agentic OS Kernel COMPLETE ===');
    log('Final decision: ' + runReport.finalDecision);
    log('Avg confidence: ' + avgConfidence.toFixed(2));

    this.memory.working.activeGoals = [];
    this.memory.addFact('FINAL: ' + stimulus + ' -> ' + runReport.finalDecision + ' (confidence: ' + avgConfidence.toFixed(2) + ')');
    this.memory.save();

    return runReport;
  }
}

module.exports = { AgenticOSKernel, CONFIG, TOOLS, KernelMemory };

if (require.main === module) {
  const args = process.argv.slice(2);
  const stimulus = args.join(' ') || 'Review office health and suggest improvements';

  const model = process.env.ORCHESTRATOR_MODEL || 'gemma3:270m';
  const kernel = new AgenticOSKernel(model);

  kernel.run(stimulus).then(report => {
    console.log('\n=== RUN REPORT ===');
    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
  }).catch(err => {
    console.error('Kernel error:', err);
    process.exit(1);
  });
}