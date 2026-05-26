import path from "node:path";
import { rebuildDocIndexes } from "../server/docs/docIndex.ts";

async function main() {
  const projectRoot = path.resolve(process.cwd());
  const { coolerCount, scrumCount, reportsCount, scrumReportsCount } = await rebuildDocIndexes(projectRoot);
  console.log(`Wrote docs/cooler/index.md (${coolerCount} items)`);
  console.log(`Wrote docs/scrum/index.md (${scrumCount} items)`);
  console.log(`Wrote docs/reports/index.md (${reportsCount} items)`);
  console.log(`Wrote SCRUM_REPORTS/index.md (${scrumReportsCount} items)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
