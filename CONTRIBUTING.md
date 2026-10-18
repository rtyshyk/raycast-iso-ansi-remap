# Contributing

## Development

```sh
npm install
npm run dev         # imports the extension into Raycast; it stays after you stop the dev server
npm test            # vitest: keyremap.sh against fake hidutil/launchctl, plus the status parser
npm run typecheck
npm run lint        # ray lint, plus ESLint and Prettier on test/
```

## How it works

All the work is in `assets/keyremap.sh` (bash 3.2, the macOS `/bin/bash`). The commands call it with `execFile("/bin/bash", [script, action])`, because Raycast drops the exec bit when it installs assets. It also runs on its own:

```sh
/bin/bash assets/keyremap.sh on | off | status | install | uninstall
```

- `hidutil property --matching '{"Product":"Apple Internal Keyboard / Trackpad"}'` targets the built-in keyboard. On Apple silicon MacBooks keys go through two services of that device (`AppleHIDKeyboardEventDriverV2` and `AppleDeviceManagementHIDEventService`); a filter on `PrimaryUsagePage 1 / PrimaryUsage 6` only matches the first, and the remap then has no effect.
- `--set` replaces the whole `UserKeyMapping` array, so every write reads the current rules, removes or adds only ours, and writes the rest back. `--get` prints usages in decimal, and `--set` accepts decimal.
- Usages (`0x7` page in the high 32 bits): `0x700000064` is the § key left of 1 (HID "non-US backslash"), `0x700000035` is the key beside the left Shift (HID "grave accent"), `0x7000000E1` is Left Shift.
- `install` copies the script to `~/Library/Application Support/iso-ansi-remap/` and points the LaunchAgent at the copy, so the agent keeps working when Raycast updates or moves the extension.

Tests replace `hidutil` and `launchctl` through the `HIDUTIL` and `LAUNCHCTL` variables (`test/fixtures/`), and use a temporary `HOME`. They run on Linux CI too.

## CI and releases

GitHub Actions (`.github/workflows/`):

- **CI** runs on every push to `main` and every pull request: `npm ci`, lint, a `dist` build (which also generates the types), typecheck and tests.
- **Release** runs when you push a `v*` tag: the full CI, then a GitHub release with the built extension as a zip. Nothing is published to the Raycast Store.

CI uses the Node version in `.nvmrc` (24; the Raycast CLI needs 22.22.2 or newer).

## Publishing to the Raycast Store

`npm run publish` opens a pull request to [raycast/extensions](https://github.com/raycast/extensions). After review it is merged and appears in the Store. If anyone changed the extension there, run `npx @raycast/api@latest pull-contributions` first.

Before publishing:

- Update to the latest `@raycast/api` and `@raycast/utils`, then run `npm run lint`, `npm run build:dist`, `npm run typecheck` and `npm test`.
- Add 3–6 screenshots to `metadata/`: PNG, 2000×1250, one background for all, no personal data. Raycast's Window Capture with "Save to Metadata" takes them in that format. The status view is the main one.
- Add a `CHANGELOG.md` entry: `## [Title] - {PR_MERGE_DATE}`.

## Icon

`assets/icon.png` is rendered from `design/icon.svg` with AppKit:

```sh
swift design/render.swift design/icon.svg assets/icon.png
```

`design/` is not bundled into the extension.
