# ISO to ANSI Keyboard Remap

Make the built-in ISO keyboard of a MacBook type like a US (ANSI) one, without Karabiner or any other app running in the background.

On European (ISO) MacBook keyboards the left Shift is short, and the key between it and Z holds ` and ~. The key left of 1 holds § and ±, which most people rarely type. This extension changes two keys:

| Key on the built-in keyboard | Before | After |
| --- | --- | --- |
| Left of 1 | § ± | \` ~ |
| Right of the short left Shift | \` ~ | Shift |

So ~ is back where US layouts have it, and the left Shift works as one long key.

## Commands

- **Show Remap Status**: shows whether the remap and its autostart are on, the active rules, and actions to change both. Start here if a key behaves unexpectedly.
- **Enable Remap**: remaps the keys now. It lasts until you log out or restart.
- **Disable Remap**: puts the keys back now.
- **Install Autostart**: turns the remap on now and at every login.
- **Remove Autostart**: stops it at login and turns it off now.

## What it changes on your Mac

The remap uses `hidutil`, which is built into macOS. It runs in the keyboard driver, so it works in every app and every input source (ABC, Ukrainian, German and so on), and nothing keeps running after a command finishes.

- **Only the built-in keyboard.** The rules go only to the HID device named "Apple Internal Keyboard / Trackpad". External keyboards are not changed.
- **Your other remaps stay.** macOS keeps one list of key remaps per keyboard. The extension adds or removes only its own two rules, so remaps from System Settings (for example Caps Lock) or other tools are kept.
- **Autostart** adds `~/Library/LaunchAgents/io.github.rtyshyk.iso-ansi-remap.plist` and a copy of the script in `~/Library/Application Support/iso-ansi-remap/`. The LaunchAgent runs once at login. Remove Autostart deletes both.
- **No admin rights or extra permissions** are needed.

The § and ± characters are no longer on a key while the remap is on. On the ABC layout, ⌥6 types §.

## If something goes wrong

Run **Show Remap Status**. It lists the rules that are active on the built-in keyboard.

You can also turn everything off without Raycast. In Terminal:

```sh
launchctl bootout gui/$(id -u)/io.github.rtyshyk.iso-ansi-remap
rm -f ~/Library/LaunchAgents/io.github.rtyshyk.iso-ansi-remap.plist
rm -rf ~/Library/Application\ Support/iso-ansi-remap
```

Then restart the Mac or log out and back in. `hidutil` remaps don't survive a restart, so the keyboard is back to normal. This also drops any other `hidutil` remaps until the tool that set them runs again.

Other tools that set key remaps with `hidutil` replace the whole list for the keyboard. If one of them runs after this extension, the two rules can disappear. Run **Enable Remap** again, or check **Show Remap Status**.

## Requirements

- A Mac laptop with an ISO keyboard (the tall Return key, and a key between the left Shift and Z).
- On a US (ANSI) keyboard there is no § key, so the remap would only turn your ` ~ key into Shift. Don't enable it there.

Developing and publishing: see [CONTRIBUTING.md](https://github.com/rtyshyk/raycast-iso-ansi-remap/blob/main/CONTRIBUTING.md).
