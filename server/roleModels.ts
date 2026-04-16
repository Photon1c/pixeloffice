import mapping from "./model_role_mapping.json";

export type RoleId = "custodian" | "clerk" | "specialist" | "executive" | "office_assistant" | "workload_planner";

// Autonomy Zones: Green (auto), Yellow (propose/approve), Red (human only)
export const AUTONOMY_ZONES = {
  // Tool permissions by zone
  GREEN: ["search_knowledge_base", "read_file", "get_weather"],
  YELLOW: ["schedule_scrum", "add_calendar_deadline", "create_improvement_ticket", "create_scrum", "promote_cooler"],
  RED: ["write_code", "delete_data", "migrate_db", "update_secrets"]
} as const;

export const autonomyConfig = {
  // Tools available to each role
  receptionist: { tools: ["GREEN"], maxTokens: 512 },
  clerk: { tools: ["GREEN", "YELLOW"], maxTokens: 1024 },
  specialist: { tools: ["GREEN", "YELLOW"], maxTokens: 2048 },
  executive: { tools: ["GREEN", "YELLOW", "RED"], maxTokens: 4096 },
  custodian: { tools: ["GREEN"], maxTokens: 512 },
  archivist: { tools: ["GREEN"], maxTokens: 1024 },
} as const;

export const roleToAgentMap: Record<RoleId, string> = {
  receptionist: "frontdesk",
  custodian: "ironclaw",
  clerk: "openclaw",
  specialist: "zeroclaw",
  archivist: "hermitclaw",
  executive: "leslieclaw",
  office_assistant: "openclaw",
  workload_planner: "openclaw",
};

export interface RoleModelConfig {
  role: RoleId;
  provider: "ollama" | "llama_cpp" | "remote";
  modelName: string;
  endpoint: string;
  params?: {
    temperature?: number;
    max_tokens?: number;
  };
}

const KB_SERVER_URL = process.env.KB_SERVER_URL || "http://127.0.0.1:8787";

export const tools = [
  {
    type: "function",
    function: {
      name: "search_knowledge_base",
      description: "Search the knowledge base for relevant documents or information. Use this when the user asks about project documentation, files, or needs to find information in the knowledge base.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query to find relevant documents"
          },
          top_k: {
            type: "number",
            description: "Maximum number of results to return",
            default: 5
          }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "read_file",
      description: "Read the contents of a file from the local filesystem. Use this when the user asks to read or examine a specific file.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Absolute or relative path to the file to read"
          }
        },
        required: ["path"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "schedule_scrum",
      description: "Schedule a scrum session to work on improving a document, codebase, or feature. Use this when the user wants to iterate, fix, improve, or build something - it creates a time-boxed improvement session.",
      parameters: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            description: "What to work on (e.g., 'fix the login bug', 'improve the flight-sim README')"
          },
          document: {
            type: "string",
            description: "Document or file to reference for the session"
          },
          deadline: {
            type: "string",
            description: "When to complete (e.g., 'in 2 hours', 'tomorrow 3pm', '2024-01-15T17:00:00')"
          },
          priority: {
            type: "string",
            description: "Priority level",
            enum: ["low", "normal", "high", "urgent"],
            default: "normal"
          }
        },
        required: ["topic"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_calendar_deadline",
      description: "Add a deadline or reminder for a task. Use this to set time-based goals for work items.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Title of the deadline/task"
          },
          deadline: {
            type: "string",
            description: "When the task is due (e.g., 'in 1 hour', 'tomorrow', '2024-01-15T17:00:00')"
          },
          assignee: {
            type: "string",
            description: "Who should complete this task"
          },
          notes: {
            type: "string",
            description: "Additional context or details"
          }
        },
        required: ["title", "deadline"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_improvement_ticket",
      description: "Create a ticket for improving something in the backlog. Use this when issues are found or improvements are identified.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Brief title of the improvement needed"
          },
          description: {
            type: "string",
            description: "Details about what needs improvement"
          },
          priority: {
            type: "string",
            description: "Priority level",
            enum: ["low", "normal", "high", "urgent"],
            default: "normal"
          },
          related_document: {
            type: "string",
            description: "Related file or document if any"
          }
        },
        required: ["title"]
      }
    }
  }
];

export function getRoleModelConfig(role: RoleId | string): RoleModelConfig {
  const entry = (mapping as any)[role] || (mapping as any)["clerk"];
  if (!entry) {
    throw new Error(`No model mapping defined for role: ${role}`);
  }

  // Check if there's a fallback provider (e.g., NVIDIA for executive)
  if (entry.fallback && entry.provider !== "ollama") {
    console.log(`[RoleModel] ${role} using fallback: ${entry.provider}/${entry.model_name}`);
  }

  return {
    role: (role as RoleId) || "clerk",
    provider: entry.provider || "ollama",
    modelName: entry.model_name || entry.modelName,
    endpoint: entry.provider === "nvidia" ? "nvidia" : (process.env.OLLAMA_ENDPOINT || "http://localhost:11434"),
    params: {
      temperature: entry.temperature ?? 0.2,
      max_tokens: entry.max_tokens ?? 1024,
    },
  };
}

// Get model for quick transitions (handoff/thought loop)
export function getQuickTransitionModel(): RoleModelConfig {
  return getRoleModelConfig("handoff");
}

// Get model for executive decisions with reasoning
export function getExecutiveModel(): RoleModelConfig {
  return getRoleModelConfig("executive");
}

function approximateTokens(text: string): number {
  if (!text || typeof text !== "string") return 0;
  return Math.ceil(text.length / 4);
}

async function executeTool(toolCall: { name: string; arguments: any }): Promise<any> {
  const { name, arguments: args } = toolCall;
  
  console.log(`[Tools] Executing: ${name}`, args);
  
  switch (name) {
    case "search_knowledge_base": {
      try {
        const resp = await fetch(`${KB_SERVER_URL}/search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: args.query, top_k: args.top_k || 5 }),
        });
        const data = await resp.json();
        const results = data.results || [];
        return {
          content: results.length > 0 
            ? results.map((r: any) => r.text || JSON.stringify(r)).join("\n---\n")
            : "No results found in knowledge base."
        };
      } catch (e: any) {
        return { error: `Knowledge base search failed: ${e.message}` };
      }
    }
    
    case "read_file": {
      try {
        const fs = await import("fs/promises");
        const content = await fs.readFile(args.path, "utf-8");
        return { content: content.slice(0, 8000) }; // Limit to 8k chars
      } catch (e: any) {
        return { error: `Could not read file: ${e.message}` };
      }
    }
    
    case "schedule_scrum":
    case "add_calendar_deadline":
    case "create_improvement_ticket": {
      try {
        const endpoint = "http://127.0.0.1:4173/api/calendar/" + (name === "schedule_scrum" ? "scrum" : name === "add_calendar_deadline" ? "deadline" : "ticket");
        const body: any = { ...args };
        if (name === "schedule_scrum") {
          body.workflow_type = "improvement";
        }
        
        const resp = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await resp.json();
        return data;
      } catch (e: any) {
        return { error: `Failed to schedule: ${e.message}` };
      }
    }
    
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

export async function callChatModelForRole(role: RoleId, messages: any[], options: any = {}): Promise<any> {
  const config = getRoleModelConfig(role);
  const agentName = roleToAgentMap[role] || role;
  
  const promptContent = messages.map(m => m.content).join("\n");
  
  if (config.provider === "ollama") {
    const url = `${config.endpoint}/api/chat`;
    const payload = {
      model: config.modelName,
      messages: messages,
      stream: false,
      options: {
        temperature: options.temperature ?? config.params?.temperature ?? 0.2,
        num_predict: options.max_tokens ?? config.params?.max_tokens ?? 1024,
      },
    };

    // Add tools if not disabled
    if (options.tools !== false) {
      (payload as any).tools = tools;
    }

    const startTime = Date.now();
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      console.error(`[Office-Chat] Role=${config.role}, Model=${config.modelName}, Latency=${latencyMs}ms, Success=False, Error=${response.statusText}`);
      throw new Error(`Ollama chat call failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`[Office-Chat] Role=${config.role}, Model=${config.modelName}, Latency=${latencyMs}ms, Success=True`);
    
    // Check for tool calls in the response
    const toolCalls = result.message?.tool_calls || [];
    let finalResponse = result.message?.content;
    let toolResults: any[] = [];
    
    if (toolCalls.length > 0) {
      console.log(`[Tools] Found ${toolCalls.length} tool call(s) in response`);
      
      for (const tc of toolCalls) {
        const toolResult = await executeTool({
          name: tc.function?.name,
          arguments: typeof tc.function?.arguments === 'string' 
            ? JSON.parse(tc.function.arguments)
            : tc.function?.arguments
        });
        toolResults.push({ tool: tc.function?.name, result: toolResult });
        
        // Add tool result as a message for the model to incorporate
        messages.push({
          role: "tool",
          content: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult),
          tool_call_id: tc.id || tc.function?.name
        });
      }
      
      // Second pass: get final response with tool results
      const secondResponse = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: config.modelName,
          messages: messages,
          stream: false,
          options: payload.options
        })
      });
      
      if (secondResponse.ok) {
        const secondResult = await secondResponse.json();
        finalResponse = secondResult.message?.content;
      }
    }
    
    const promptTokens = result.prompt_eval_count || 0;
    const completionTokens = result.eval_count || 0;
    
    return {
      success: true,
      role: config.role,
      agent: agentName,
      model: config.modelName,
      provider: config.provider,
      response: finalResponse,
      raw_response: result,
      latency_ms: latencyMs,
      tool_calls: toolCalls.length > 0 ? toolResults : undefined,
      usage: {
        prompt_tokens: promptTokens || approximateTokens(promptContent),
        completion_tokens: completionTokens || approximateTokens(finalResponse),
        total_tokens: (promptTokens || approximateTokens(promptContent)) + (completionTokens || approximateTokens(finalResponse)),
      },
    };
  } else {
    throw new Error(`Provider ${config.provider} not supported in JS client yet`);
  }
}