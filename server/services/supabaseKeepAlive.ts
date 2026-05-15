import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2];
    }
  });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.warn("[SupabaseKeepAlive] Missing SUPABASE_URL or SUPABASE_KEY - keep-alive disabled");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const INTERVAL_MS = 4 * 60 * 60 * 1000;

async function ping(): Promise<void> {
  if (!supabaseUrl || !supabaseKey) return;
  try {
    const start = Date.now();
    const { error } = await supabase.from("cooler_sessions").select("id", { count: "exact", head: true }).limit(1);
    const elapsed = Date.now() - start;
    if (error) {
      console.warn(`[SupabaseKeepAlive] Ping failed after ${elapsed}ms: ${error.message}`);
      return;
    }
    console.log(`[SupabaseKeepAlive] Ping OK (${elapsed}ms)`);
  } catch (err: any) {
    console.warn(`[SupabaseKeepAlive] Ping error: ${err?.message || err}`);
  }
}

export function startSupabaseKeepAlive(): void {
  if (!supabaseUrl || !supabaseKey) {
    console.log("[SupabaseKeepAlive] Not started - missing credentials");
    return;
  }
  ping();
  setInterval(ping, INTERVAL_MS);
  console.log(`[SupabaseKeepAlive] Started (interval: ${INTERVAL_MS / 3600000}h)`);
}
