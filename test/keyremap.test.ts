import { describe, expect, it } from "vitest";
import { parseStatus } from "../src/lib/keyremap";
import { statusMarkdown } from "../src/show-remap-status";

describe("parseStatus", () => {
  it("reads the key=value lines", () => {
    const status = parseStatus(
      [
        "remap=on",
        "autostart=not-loaded",
        "agent=/Users/me/Library/LaunchAgents/io.github.rtyshyk.iso-ansi-remap.plist",
        "rules=0x700000039:0x70000006F 0x700000064:0x700000035",
      ].join("\n"),
    );
    expect(status).toEqual({
      remap: "on",
      autostart: "not-loaded",
      agent: "/Users/me/Library/LaunchAgents/io.github.rtyshyk.iso-ansi-remap.plist",
      rules: [
        { src: "0x700000039", dst: "0x70000006F" },
        { src: "0x700000064", dst: "0x700000035" },
      ],
    });
  });

  it("handles no rules", () => {
    expect(parseStatus("remap=off\nautostart=off\nagent=/a\nrules=").rules).toEqual([]);
  });
});

describe("statusMarkdown", () => {
  it("shows the state and the Terminal fallback", () => {
    const markdown = statusMarkdown({ remap: "partial", autostart: "off", agent: "", rules: [] }, "/x/keyremap.sh");
    expect(markdown).toContain("**Remap:** partly on");
    expect(markdown).toContain('/bin/bash "/x/keyremap.sh" uninstall');
  });

  it("shows a loading line before the status arrives", () => {
    expect(statusMarkdown(undefined, "/x/keyremap.sh")).toContain("Reading the key mapping…");
  });
});
