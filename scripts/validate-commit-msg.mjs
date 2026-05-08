import { readFileSync } from "node:fs";

const file = process.argv[2];
const message = readFileSync(file, "utf8").trim();
const pattern =
  /^(feat|fix|docs|chore|refactor|test|ops|data|style|perf|build|ci)(\([a-z0-9-]+\))?!?: .{1,120}/;

if (!pattern.test(message)) {
  console.error("Commit message must use Conventional Commits, e.g. feat: add research map");
  process.exit(1);
}
