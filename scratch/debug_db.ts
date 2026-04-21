import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
  console.log("Checking leads...");
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .limit(5);

  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Sample Data:", JSON.stringify(data, null, 2));
  }
}

debug();
