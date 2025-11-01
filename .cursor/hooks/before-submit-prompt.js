#!/usr/bin/env node

const {
  readJsonFromStdin,
  logEvent,
} = require("./utils");

async function main() {
  const payload = await readJsonFromStdin();
  const prompt = payload?.prompt ?? "";
  const preview = prompt.split(/\r?\n/, 1)[0] ?? "";

  logEvent(payload, "before-submit-prompt", {
    preview,
    length: prompt.length,
  });

  process.stdout.write(
    JSON.stringify({
      continue: true,
      permission: "allow",
    }),
  );
}

main().catch((error) => {
  console.error(`[cursor-hooks] before-submit-prompt failure: ${error.message}`);
  process.stdout.write(
    JSON.stringify({
      continue: true,
      permission: "allow",
      userMessage: "Prompt logging hook failed; submission still allowed.",
    }),
  );
});

