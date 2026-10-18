# CLAUDE.md

Raycast extension "ISO to ANSI Keyboard Remap": remaps two keys on a MacBook's built-in ISO keyboard with `hidutil` (§ ± → \` ~, the key beside the short left Shift → Left Shift). Developer docs: `CONTRIBUTING.md`.

## Map

- `assets/keyremap.sh`: all the logic (`on`, `off`, `status`, `install`, `uninstall`). Bash 3.2, absolute tool paths, works without Raycast.
- `src/lib/keyremap.ts`: runs the script through `/bin/bash` and parses `status` (`key=value` lines).
- `src/lib/run-action.ts`: shared body of the four no-view commands (HUD on success, failure toast).
- `src/show-remap-status.tsx`: the Detail view with state, rules and actions.

## Checks

```sh
npm run lint && npm run typecheck && npm test && npm run build:dist
```

## Gotchas

- `hidutil --set` replaces the whole list; always read, merge, write. Never hard-code anyone's other rules.
- Match the device by `Product`, not by `PrimaryUsagePage/PrimaryUsage`: that filter misses the service the keys actually go through on Apple silicon (verified on Mac17,2, macOS 27).
- On the author's Mac, Caps Lock → F20 (`0x700000039 → 0x70000006F`) was already set on the built-in keyboard by an unknown tool (no LaunchAgent, Karabiner or login item found); the tests use it as the "foreign rule" that must survive.
- Claude Code's auto mode refuses to write LaunchAgents; test `install` through the extension or ask the user to run it.

## Raycast Store

Same rules as `../raycast-improve-writing/CLAUDE.md` (author `roman.tyshyk`, MIT, npm lockfile, latest `@raycast/api`, user-facing README, screenshots in `metadata/`, `{PR_MERGE_DATE}` changelog). Closest Store extension is Keyboard Win Mac Switch (swaps ⌥/⌘ for all keyboards); the README leads with the ISO/ANSI problem and the built-in-only targeting.

## Git

Personal repo: repo-local `user.name`/`user.email` are set on purpose. One branch and PR per change.
