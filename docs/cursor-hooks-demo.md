# Cursor Hooks Demo

This repository now includes a set of Cursor hooks that showcase how automated guardrails can level‑up day‑to‑day work on SkySnap Weather.

## What Was Added

- `beforeShellExecution`: blocks obviously destructive commands (e.g. `rm -rf`) and requires confirmation before lockfile or deploy commands. Also logs the current git branch for extra context.
- `beforeReadFile`: prevents accidental leakage of sensitive artifacts such as `.env` and Firebase configuration files when working in Cursor.
- `afterFileEdit`: runs `npm run lint -- --max-warnings=0 <file>` for TypeScript/JavaScript edits and surfaces ESLint failures directly in the Cursor terminal.
- `beforeSubmitPrompt`: creates a light prompt journal (preview line and character count) to encourage prompt hygiene.
- `stop`: prints a git status summary when Cursor finishes a task, making it easy to see lingering changes before leaving the session.

All hooks write JSONL logs to `logs/cursor-hooks/` so you can review what fired during a session.

## How to Demo the Hooks

1. Open the repo in Cursor and ensure the hooks are loaded (`.cursor/hooks.json` should exist).
2. Try to run a destructive shell command (e.g. `rm -rf src`). The request will be denied with a friendly message.
3. Attempt to read `.env` through Cursor’s sidebar. The read should be blocked.
4. Edit a file such as `src/components/weather-app.tsx` and watch ESLint run automatically. Failures will be echoed in the terminal.
5. Submit any AI prompt; the log entries under `logs/cursor-hooks/before-submit-prompt.jsonl` will show the recorded preview.
6. When Cursor wraps up the task, observe the stop hook summary for git status and captured notes.

## Future Hook Ideas

- **Weather API sanity checks**: a `beforeShellExecution` hook that validates the presence of required environment variables (e.g. `OPENWEATHER_API_KEY`) before allowing `npm run dev`.
- **Accessibility snapshot**: an `afterFileEdit` hook that calls Playwright or Lighthouse against the running dev server when files under `src/components/` change, surfacing accessibility regressions early.
- **Forecast fixtures refresher**: a `stop` hook that refreshes local mock data by calling `/api/weather` for popular demo cities and writing snapshots to `docs/fixtures/`.
- **Telemetry scrubber**: a `beforeSubmitPrompt` hook that redacts personally identifiable information from prompts before they leave the editor.
- **Design token sync**: a `beforeReadFile` hook that auto-updates Tailwind tokens by calling the design system API whenever `tailwind.config.ts` is opened.

Feel free to iterate on the scripts in `.cursor/hooks/`—each one is a simple Node file and can be extended or replaced as needed.

