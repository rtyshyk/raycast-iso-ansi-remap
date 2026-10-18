import { getPreferenceValues, showHUD } from "@raycast/api";
import { showFailureToast } from "@raycast/utils";
import { keyremap } from "./keyremap";

// Raycast can't run code when a preference changes, so "Keep On After Restart" is applied on the next Enable.
export async function enableRemap(): Promise<string> {
  const { keepOnAfterRestart } = getPreferenceValues<Preferences>();
  if (keepOnAfterRestart) {
    await keyremap("install");
    return "Remap On, Also After Restart";
  }
  await keyremap("uninstall");
  await keyremap("on");
  return "Remap On Until Restart";
}

export async function disableRemap(): Promise<string> {
  await keyremap("uninstall");
  return "Remap Off";
}

export async function runAction(action: () => Promise<string>) {
  try {
    await showHUD(`⌨️ ${await action()}`);
  } catch (error) {
    await showFailureToast(error, { title: "Key remap failed" });
  }
}
