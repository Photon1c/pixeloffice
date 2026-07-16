import "dotenv/config";
import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "ollama",
  baseURL: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434/v1",
});
