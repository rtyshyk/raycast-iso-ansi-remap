import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { environment } from "@raycast/api";

const execFileAsync = promisify(execFile);

export type KeyremapAction = "on" | "off" | "status" | "install" | "uninstall";

export interface RemapStatus {
  remap: "on" | "off" | "partial";
  autostart: "on" | "off" | "not-loaded";
  agent: string;
  rules: { src: string; dst: string }[];
}

export const scriptPath = () => path.join(environment.assetsPath, "keyremap.sh");

// Assets lose their exec bit when Raycast installs the extension, so the script always runs through bash.
export async function keyremap(action: KeyremapAction): Promise<string> {
  try {
    const { stdout } = await execFileAsync("/bin/bash", [scriptPath(), action]);
    return stdout.trim();
  } catch (error) {
    const stderr = (error as { stderr?: string }).stderr?.trim();
    throw new Error(stderr || (error as Error).message);
  }
}

export function parseStatus(text: string): RemapStatus {
  const values = new Map<string, string>();
  for (const line of text.split("\n")) {
    const index = line.indexOf("=");
    if (index > 0) values.set(line.slice(0, index), line.slice(index + 1));
  }
  const rules = (values.get("rules") ?? "")
    .split(" ")
    .filter(Boolean)
    .map((pair) => {
      const [src, dst] = pair.split(":");
      return { src, dst };
    });
  return {
    remap: (values.get("remap") ?? "off") as RemapStatus["remap"],
    autostart: (values.get("autostart") ?? "off") as RemapStatus["autostart"],
    agent: values.get("agent") ?? "",
    rules,
  };
}

export async function getStatus(): Promise<RemapStatus> {
  return parseStatus(await keyremap("status"));
}
