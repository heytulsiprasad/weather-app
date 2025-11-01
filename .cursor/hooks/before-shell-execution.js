#!/usr/bin/env node

const { execSync } = require("node:child_process");
const {
  readJsonFromStdin,
  logEvent,
  getWorkspaceRoot,
} = require("./utils");

async function main() {
  const payload = await readJsonFromStdin();
  const command = payload?.command ?? "";
  const workspaceRoot = getWorkspaceRoot(payload);

  logEvent(payload, "before-shell-execution", {
    command,
  });

  const lowerCmd = command.toLowerCase();
  const dangerousPatterns = [
    {
      test: /rm\s+-rf\s+/,
      message: "Destructive `rm -rf` command blocked. Run it manually outside Cursor if you're sure.",
    },
    {
      test: /git\s+push/,
      message: "Pushing from inside Cursor is disabled to encourage manual review in terminal.",
    },
  ];

  const softGuardPatterns = [
    {
      test: /(npm|pnpm|yarn)\s+install\b/,
      message: "Install commands can rewrite lockfiles. Confirm before continuing.",
    },
    {
      test: /firebase\s+deploy/,
      message: "Production deploy detected. Double-check Firebase configs before shipping.",
    },
  ];

  const blocked = dangerousPatterns.find((entry) => entry.test.test(lowerCmd));
  if (blocked) {
    respond({
      continue: false,
      permission: "deny",
      userMessage: `❌ ${blocked.message}`,
    });
    return;
  }

  const guarded = softGuardPatterns.find((entry) => entry.test.test(lowerCmd));
  if (guarded) {
    respond({
      continue: false,
      permission: "ask",
      userMessage: `⚠️ ${guarded.message}`,
    });
    return;
  }

  // Allow command while enriching context about current branch for terminal output.
  try {
    const branch = execSync("git rev-parse --abbrev-ref HEAD", {
      cwd: workspaceRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
      .trim()
      .replace(/\s+/g, " ");

    respond({
      continue: true,
      permission: "allow",
      metadata: {
        branch,
      },
    });
  } catch {
    respond({
      continue: true,
      permission: "allow",
    });
  }
}

function respond(result) {
  process.stdout.write(JSON.stringify(result));
}

main().catch((error) => {
  console.error(`[cursor-hooks] before-shell-execution failure: ${error.message}`);
  respond({
    continue: false,
    permission: "deny",
    userMessage: "Cursor hook failed; shell command cancelled for safety.",
  });
});
