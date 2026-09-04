import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

/**
 * Runs the feature generator and checks its output against FEATURE_CONTRACT.md.
 *
 * The previous automation check asserted that four generator *files existed*.
 * It never ran one, and feature generation was not among the four — so a
 * generator could produce a feature with no route segment, which is a feature
 * nobody can open, and nothing would report it.
 */

const ROOT = resolve(process.cwd());

/** A name no human would pick, so a leftover directory is obviously ours. */
const FEATURE = "generator-contract-probe";
const PASCAL = "GeneratorContractProbe";

const featureDir = join(ROOT, "src", "features", FEATURE);
const routeDir = join(ROOT, "src", "app", FEATURE);

/**
 * The two halves. A feature that exists in only one of these trees is the
 * failure this check is for.
 */
const REQUIRED = [
  join(featureDir, "views", `${PASCAL}View.tsx`),
  join(featureDir, "views", `${PASCAL}View.module.scss`),
  join(featureDir, "views", `${PASCAL}View.stories.tsx`),
  join(featureDir, "views", `${PASCAL}View.test.tsx`),
  join(routeDir, "page.tsx"),
];

const failures: string[] = [];

function cleanup() {
  rmSync(featureDir, { recursive: true, force: true });
  rmSync(routeDir, { recursive: true, force: true });

  /**
   * Next writes route type validators into `.next/types` during a build, and
   * they reference every route segment by path. Removing a segment without
   * clearing them leaves `tsc --noEmit` failing on a module that no longer
   * exists — a failure about a probe route, in a repository where nobody
   * created one. Next regenerates these on the next build.
   */
  rmSync(join(ROOT, ".next", "types"), { recursive: true, force: true });
}

function run(args: string[]) {
  execFileSync("npx", ["tsx", "scripts/generate-feature.ts", ...args], {
    cwd: ROOT,
    stdio: "pipe",
    shell: true,
  });
}

cleanup();

try {
  run([FEATURE]);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  failures.push(`generate-feature.ts failed to run: ${message}`);
}

for (const path of REQUIRED) {
  if (!existsSync(path)) failures.push(`generate-feature.ts did not create ${path.slice(ROOT.length + 1)}`);
}

/** An empty directory advertises a convention the generator did not follow. */
if (existsSync(featureDir)) {
  for (const entry of readdirSync(featureDir)) {
    const path = join(featureDir, entry);

    if (statSync(path).isDirectory() && readdirSync(path).length === 0) {
      failures.push(`generate-feature.ts left src/features/${FEATURE}/${entry}/ empty`);
    }
  }
}

/**
 * A generated view must not opt into the client bundle. Server-first is the
 * reason this boilerplate exists, and a default that quietly went the other way
 * would undo it one feature at a time.
 */
const viewPath = join(featureDir, "views", `${PASCAL}View.tsx`);

if (existsSync(viewPath)) {
  if (readFileSync(viewPath, "utf-8").includes("use client")) {
    failures.push("generate-feature.ts marked the generated view as a client component");
  }
}

/** Re-running must refuse rather than overwrite work that is not committed. */
let refused = false;

try {
  run([FEATURE]);
} catch {
  refused = true;
}

if (!refused) failures.push("generate-feature.ts overwrote an existing feature instead of refusing");

/** A name with a path separator must not be able to write outside the two trees. */
let rejectedPath = false;

try {
  run(["../escaped"]);
} catch {
  rejectedPath = true;
}

if (!rejectedPath) failures.push("generate-feature.ts accepted a name containing a path separator");

cleanup();

/**
 * `generate.ts` must delegate rather than keep its own copy. It used to hold
 * an inlined version that produced a different, incomplete result, so which
 * command you typed decided whether the contract was followed.
 */
const entryPoint = readFileSync(join(ROOT, "scripts/generate.ts"), "utf-8");

if (!entryPoint.includes("scripts/generate-feature.ts")) {
  failures.push("scripts/generate.ts does not delegate feature generation to generate-feature.ts");
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  console.error("\nSee FEATURE_CONTRACT.md for what a generated feature must contain.");
  process.exit(1);
}

console.log("[generators] Generated features match FEATURE_CONTRACT.md.");
