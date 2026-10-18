import { beforeEach, describe, expect, it, vi } from "vitest";
import { showHUD } from "@raycast/api";
import { setPreferences } from "./mocks/raycast-api";
import { keyremap } from "../src/lib/keyremap";
import { disableRemap, enableRemap, runAction } from "../src/lib/run-action";

vi.mock("../src/lib/keyremap", () => ({ keyremap: vi.fn(async () => "") }));

beforeEach(() => setPreferences({}));

describe("enableRemap", () => {
  it("installs the LaunchAgent when Keep On After Restart is on", async () => {
    expect(await enableRemap()).toBe("Remap On, Also After Restart");
    expect(vi.mocked(keyremap).mock.calls).toEqual([["install"]]);
  });

  it("removes the LaunchAgent and turns the remap on when the preference is off", async () => {
    setPreferences({ keepOnAfterRestart: false });
    expect(await enableRemap()).toBe("Remap On Until Restart");
    expect(vi.mocked(keyremap).mock.calls).toEqual([["uninstall"], ["on"]]);
  });
});

describe("disableRemap", () => {
  it("removes the LaunchAgent and turns the remap off", async () => {
    expect(await disableRemap()).toBe("Remap Off");
    expect(vi.mocked(keyremap).mock.calls).toEqual([["uninstall"]]);
  });
});

describe("runAction", () => {
  it("shows the result in a HUD", async () => {
    await runAction(async () => "Remap Off");
    expect(showHUD).toHaveBeenCalledWith("⌨️ Remap Off");
  });

  it("shows a failure toast instead of a HUD", async () => {
    await runAction(async () => {
      throw new Error("Built-in keyboard not found");
    });
    expect(showHUD).not.toHaveBeenCalled();
  });
});
