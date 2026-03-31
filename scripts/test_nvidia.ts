import { nvidiaChat } from "../server/llm/nvidiaClient";
import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function testNvidia() {
  console.log("Testing NVIDIA Integration...");
  console.log("API KEY exists:", !!process.env.NVIDIA_API_KEY);
  
  try {
    const result = await nvidiaChat([
      { role: "user", content: "Hello, who are you? Respond in 5 words." }
    ]);
    console.log("NVIDIA Response:", result.content);
    console.log("Success!");
  } catch (err: any) {
    console.error("NVIDIA Test Failed:", err.message);
  }
}

testNvidia();
