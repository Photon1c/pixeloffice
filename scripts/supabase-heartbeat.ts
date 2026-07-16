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
  console.error("[SupabaseHeartbeat] Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function ping() {
  const start = Date.now();
  try {
    const { error } = await supabase.from("cooler_sessions").select("id", { count: "exact", head: true }).limit(1);
    const elapsed = Date.now() - start;
    if (error) {
      console.error(`[SupabaseHeartbeat] FAILED (${elapsed}ms): ${error.message}`);
      process.exit(1);
    }
    console.log(`[SupabaseHeartbeat] OK (${elapsed}ms)`);
  } catch (err) {
    console.error(`[SupabaseHeartbeat] ERROR: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }
}

ping().then(() => process.exit(0));
