import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from "@playwright/test/reporter";

type RunManifest = {
  runId: string;
  startedAt: string;
  finishedAt?: string;
  status: "running" | FullResult["status"];
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  artifactDirectory: string;
};

export default class RunReporter implements Reporter {
  private manifest!: RunManifest;
  private manifestPath = "";

  onBegin(config: FullConfig, suite: Suite) {
    const runId = process.env.E2E_RUN_ID;
    if (!runId) throw new Error("E2E_RUN_ID was not initialized by playwright.config.ts");

    const artifactDirectory = config.projects[0]?.outputDir;
    if (!artifactDirectory) throw new Error("Playwright outputDir is not configured");

    mkdirSync(artifactDirectory, { recursive: true });
    this.manifestPath = join(artifactDirectory, "run.json");
    this.manifest = {
      runId,
      startedAt: new Date().toISOString(),
      status: "running",
      total: suite.allTests().length,
      passed: 0,
      failed: 0,
      skipped: 0,
      artifactDirectory,
    };
    this.writeManifest();

    const testResultsRoot = join(process.cwd(), "test-results");
    mkdirSync(testResultsRoot, { recursive: true });
    writeFileSync(join(testResultsRoot, "latest-run-id.txt"), `${runId}\n`);
    console.log(`\nE2E Run ID: ${runId}`);
    console.log(`Artifacts: ${artifactDirectory}\n`);
  }

  onTestEnd(_test: TestCase, result: TestResult) {
    if (result.status === "passed") this.manifest.passed += 1;
    else if (result.status === "skipped") this.manifest.skipped += 1;
    else this.manifest.failed += 1;
    this.writeManifest();
  }

  onEnd(result: FullResult) {
    this.manifest.status = result.status;
    this.manifest.finishedAt = new Date().toISOString();
    this.writeManifest();
    console.log(`\nRun ${this.manifest.runId}: ${result.status}`);
    console.log(`Open artifacts: npm run test:e2e:artifacts -- ${this.manifest.runId}`);
    console.log(`Open traces: npm run test:e2e:trace -- ${this.manifest.runId}`);
  }

  private writeManifest() {
    writeFileSync(this.manifestPath, `${JSON.stringify(this.manifest, null, 2)}\n`);
  }
}
