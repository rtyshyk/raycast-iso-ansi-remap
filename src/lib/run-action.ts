import { showHUD } from "@raycast/api";
import { showFailureToast } from "@raycast/utils";
import { keyremap, KeyremapAction } from "./keyremap";

export async function runAction(action: KeyremapAction, success: string) {
  try {
    await keyremap(action);
    await showHUD(success);
  } catch (error) {
    await showFailureToast(error, { title: "Key remap failed" });
  }
}
