#!/usr/bin/env node

const { spawnSync } = require("node:child_process");
const {
  readJsonFromStdin,
  logEvent,
  getWorkspaceRoot,
} = require("./utils");

async function main() {
  const payload = await readJsonFromStdin();
  const workspaceRoot = getWorkspaceRoot(payload);

  const gitStatus = spawnSync("git", ["status", "--short"], {
    cwd: workspaceRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  const statusOutput = gitStatus.stdout ? gitStatus.stdout.trim() : "";

  logEvent(payload, "stop", {
    taskStatus: payload?.status ?? "unknown",
    filesChanged: statusOutput ? statusOutput.split("\n").length : 0,
  });

  const summaryLines = [
    "",
    "──────── Cursor Hook Summary ────────",
    `Task status: ${payload?.status ?? "unknown"}`,
  ];

  if (statusOutput) {
    summaryLines.push("Pending git changes:");
    summaryLines.push(statusOutput);
  } else {
    summaryLines.push("Working tree is clean.");
  }

  if (payload?.notes?.length) {
    summaryLines.push("");
    summaryLines.push("Notes captured during run:");
    payload.notes.forEach((note, idx) => {
      summaryLines.push(`${idx + 1}. ${note}`);
    });
  }

  summaryLines.push("───────────────────────────────────");
  summaryLines.push("");

  console.error(summaryLines.join("\n"));
}

main().catch((error) => {
  console.error(`[cursor-hooks] stop hook failure: ${error.message}`);
});

