import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const SCRIPT = path.resolve("assets/keyremap.sh");
const FIXTURES = path.resolve("test/fixtures");

const CAPS_TO_F20 = "30064771129 30064771183";
const SECTION_TO_GRAVE = "30064771172 30064771125";
const GRAVE_TO_SHIFT = "30064771125 30064771297";

let home: string;
let state: string;
let launchctlLog: string;

function run(action: string, extraEnv: Record<string, string> = {}) {
  return execFileSync("/bin/bash", [SCRIPT, action], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      PATH: "/usr/bin:/bin",
      HOME: home,
      HIDUTIL: path.join(FIXTURES, "hidutil"),
      LAUNCHCTL: path.join(FIXTURES, "launchctl"),
      FAKE_HID_STATE: state,
      FAKE_LAUNCHCTL_LOG: launchctlLog,
      ...extraEnv,
    },
  }).trim();
}

const rules = () => fs.readFileSync(state, "utf8").trim().split("\n").filter(Boolean);
const agentPath = () => path.join(home, "Library/LaunchAgents/io.github.rtyshyk.iso-ansi-remap.plist");

beforeEach(() => {
  home = fs.mkdtempSync(path.join(os.tmpdir(), "keyremap-"));
  state = path.join(home, "hid-state");
  launchctlLog = path.join(home, "launchctl.log");
  fs.writeFileSync(state, `${CAPS_TO_F20}\n`);
  fs.chmodSync(path.join(FIXTURES, "hidutil"), 0o755);
  fs.chmodSync(path.join(FIXTURES, "launchctl"), 0o755);
});

afterEach(() => fs.rmSync(home, { recursive: true, force: true }));

describe("keyremap.sh", () => {
  it("adds both rules and keeps other remaps", () => {
    expect(run("on")).toBe("Remap is on");
    expect(rules()).toEqual([CAPS_TO_F20, SECTION_TO_GRAVE, GRAVE_TO_SHIFT]);
  });

  it("does not duplicate rules when run twice", () => {
    run("on");
    run("on");
    expect(rules()).toEqual([CAPS_TO_F20, SECTION_TO_GRAVE, GRAVE_TO_SHIFT]);
  });

  it("replaces another rule for the same keys", () => {
    fs.writeFileSync(state, `${CAPS_TO_F20}\n30064771172 30064771113\n`);
    run("on");
    expect(rules()).toEqual([CAPS_TO_F20, SECTION_TO_GRAVE, GRAVE_TO_SHIFT]);
  });

  it("removes only its own rules", () => {
    run("on");
    expect(run("off")).toBe("Remap is off");
    expect(rules()).toEqual([CAPS_TO_F20]);
  });

  it("writes an empty mapping when no rules are left", () => {
    fs.writeFileSync(state, "");
    run("on");
    run("off");
    expect(rules()).toEqual([]);
  });

  it("reports status with rules in hex", () => {
    expect(run("status")).toContain("remap=off\nautostart=off");
    run("on");
    const status = run("status");
    expect(status).toContain("remap=on");
    expect(status).toContain("rules=0x700000039:0x70000006F 0x700000064:0x700000035 0x700000035:0x7000000E1");
  });

  it("reports a partial remap", () => {
    fs.writeFileSync(state, `${SECTION_TO_GRAVE}\n`);
    expect(run("status")).toContain("remap=partial");
  });

  it("installs a LaunchAgent that runs the copied script at login", () => {
    expect(run("install")).toBe("Autostart installed, remap is on");
    const plist = fs.readFileSync(agentPath(), "utf8");
    const copy = path.join(home, "Library/Application Support/iso-ansi-remap/keyremap.sh");
    expect(plist).toContain(`<string>${copy}</string>`);
    expect(plist).toContain("<key>RunAtLoad</key>");
    expect(fs.readFileSync(copy, "utf8")).toBe(fs.readFileSync(SCRIPT, "utf8"));
    expect(fs.readFileSync(launchctlLog, "utf8")).toMatch(
      /bootout gui\/\d+\/io\.github\.rtyshyk\.iso-ansi-remap\nbootstrap /,
    );
    expect(rules()).toEqual([CAPS_TO_F20, SECTION_TO_GRAVE, GRAVE_TO_SHIFT]);
    expect(run("status")).toContain("autostart=on");
  });

  it("uninstalls the LaunchAgent and turns the remap off", () => {
    run("install");
    expect(run("uninstall")).toBe("Autostart removed, remap is off");
    expect(fs.existsSync(agentPath())).toBe(false);
    expect(fs.existsSync(path.join(home, "Library/Application Support/iso-ansi-remap"))).toBe(false);
    expect(rules()).toEqual([CAPS_TO_F20]);
    expect(run("status")).toContain("autostart=off");
  });

  it("reports an installed agent that is not loaded", () => {
    run("install");
    fs.rmSync(`${launchctlLog}.loaded`);
    expect(run("status")).toContain("autostart=not-loaded");
  });

  it("fails when there is no built-in keyboard", () => {
    expect(() => run("on", { FAKE_HID_NO_KEYBOARD: "1" })).toThrow(/Built-in keyboard not found/);
    expect(rules()).toEqual([CAPS_TO_F20]);
  });

  it("rejects an unknown action", () => {
    expect(() => run("toggle")).toThrow(/Usage/);
  });
});
