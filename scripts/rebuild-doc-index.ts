import path from "node:path";
import { rebuildDocIndexes } from "../server/docs/docIndex.js";

async function main() {
  const projectRoot = path.resolve(process.cwd());
  const { coolerCount, scrumCount } = await rebuildDocIndexes(projectRoot);
  console.log(`Wrote docs/cooler/index.md (${coolerCount} items)`);
  console.log(`Wrote docs/scrum/index.md (${scrumCount} items)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
