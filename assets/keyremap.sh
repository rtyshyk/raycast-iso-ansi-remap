#!/bin/bash
# ANSI layout on the built-in ISO keyboard of a Mac laptop, via hidutil.
#   § ± key (left of 1)         -> ` ~
#   ` ~ key (right of left ⇧)   -> Left Shift
#
# Usage: keyremap.sh on | off | status | install | uninstall
#   on         add the two rules now (until logout or restart)
#   off        remove the two rules now; other remaps are kept
#   status     print key=value lines: remap, autostart, rules
#   install    copy this script to Application Support and add a LaunchAgent that runs "on" at login
#   uninstall  remove the LaunchAgent and the copy, then "off"
#
# Only the built-in keyboard is touched: the rules go to the HID services whose Product is MATCH.
# hidutil replaces the whole UserKeyMapping array, so every write reads the current rules first and keeps
# the ones that are not ours. It prints key codes in decimal and accepts decimal on input.
set -euo pipefail

HIDUTIL="${HIDUTIL:-/usr/bin/hidutil}"
LAUNCHCTL="${LAUNCHCTL:-/bin/launchctl}"
MATCH='{"Product":"Apple Internal Keyboard / Trackpad"}'
LABEL="io.github.rtyshyk.iso-ansi-remap"
SUPPORT_DIR="$HOME/Library/Application Support/iso-ansi-remap"
AGENT="$HOME/Library/LaunchAgents/$LABEL.plist"

# HID usages (keyboard page 0x07 << 32): 0x700000064, 0x700000035, 0x7000000E1.
SECTION=30064771172
GRAVE=30064771125
LSHIFT=30064771297
OURS="$SECTION:$GRAVE
$GRAVE:$LSHIFT"

die() {
  echo "$*" >&2
  exit 1
}

# Current rules on the built-in keyboard, one "src:dst" per line, each pair once.
current_rules() {
  local out
  out="$("$HIDUTIL" property --matching "$MATCH" --get UserKeyMapping)" || die "hidutil failed to read the key mapping"
  echo "$out" | grep -qE '^[0-9a-fA-F]+ +UserKeyMapping' || die "Built-in keyboard not found (no HID service named Apple Internal Keyboard / Trackpad)"
  echo "$out" | awk '
    /HIDKeyboardModifierMappingDst/ { gsub(/[^0-9]/, "", $3); dst = $3 }
    /HIDKeyboardModifierMappingSrc/ { gsub(/[^0-9]/, "", $3); print $3 ":" dst }
  ' | awk '!seen[$0]++'
}

write_rules() {
  local rules="$1" json="" pair
  for pair in $rules; do
    [ -n "$json" ] && json="$json,"
    json="$json{\"HIDKeyboardModifierMappingSrc\":${pair%%:*},\"HIDKeyboardModifierMappingDst\":${pair##*:}}"
  done
  "$HIDUTIL" property --matching "$MATCH" --set "{\"UserKeyMapping\":[$json]}" >/dev/null || die "hidutil failed to write the key mapping"
}

has_rule() {
  echo "$1" | grep -qx "$2"
}

cmd_on() {
  local rules
  rules="$(current_rules)"
  # Drop any other rule for our two keys, so ours are the only ones that apply.
  rules="$(echo "$rules" | grep -vE "^($SECTION|$GRAVE):" || true)"
  write_rules "$rules
$OURS"
  echo "Remap is on"
}

cmd_off() {
  local rules
  rules="$(current_rules | grep -vxF "$OURS" || true)"
  write_rules "$rules"
  echo "Remap is off"
}

cmd_status() {
  local rules remap="off" autostart="off"
  rules="$(current_rules)"
  if has_rule "$rules" "$SECTION:$GRAVE" && has_rule "$rules" "$GRAVE:$LSHIFT"; then
    remap="on"
  elif has_rule "$rules" "$SECTION:$GRAVE" || has_rule "$rules" "$GRAVE:$LSHIFT"; then
    remap="partial"
  fi
  if [ -f "$AGENT" ]; then
    if "$LAUNCHCTL" print "gui/$(id -u)/$LABEL" >/dev/null 2>&1; then autostart="on"; else autostart="not-loaded"; fi
  fi
  echo "remap=$remap"
  echo "autostart=$autostart"
  echo "agent=$AGENT"
  echo "rules=$(for pair in $rules; do printf '0x%X:0x%X ' "${pair%%:*}" "${pair##*:}"; done | sed 's/ $//')"
}

cmd_install() {
  mkdir -p "$SUPPORT_DIR" "$(dirname "$AGENT")"
  cp "$0" "$SUPPORT_DIR/keyremap.sh"
  cat >"$AGENT" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>$SUPPORT_DIR/keyremap.sh</string>
    <string>on</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>StandardErrorPath</key>
  <string>$SUPPORT_DIR/agent.log</string>
</dict>
</plist>
EOF
  # bootstrap fails with "Input/output error" when the label is already loaded.
  "$LAUNCHCTL" bootout "gui/$(id -u)/$LABEL" >/dev/null 2>&1 || true
  "$LAUNCHCTL" bootstrap "gui/$(id -u)" "$AGENT" || die "launchctl could not load $AGENT"
  cmd_on >/dev/null
  echo "Autostart installed, remap is on"
}

cmd_uninstall() {
  "$LAUNCHCTL" bootout "gui/$(id -u)/$LABEL" >/dev/null 2>&1 || true
  rm -f "$AGENT"
  rm -rf "$SUPPORT_DIR"
  cmd_off >/dev/null
  echo "Autostart removed, remap is off"
}

case "${1:-}" in
  on) cmd_on ;;
  off) cmd_off ;;
  status) cmd_status ;;
  install) cmd_install ;;
  uninstall) cmd_uninstall ;;
  *) die "Usage: $(basename "$0") on | off | status | install | uninstall" ;;
esac
