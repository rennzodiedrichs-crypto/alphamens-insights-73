import { fetchLeadsByBarber } from './src/lib/leads';

async function run() {
  try {
    const leads = await fetchLeadsByBarber("Gustavo");
    console.log("LEADS FETCHED:", JSON.stringify(leads, null, 2));
  } catch (e) {
    console.error("ERROR:", e);
  }
}

run();
