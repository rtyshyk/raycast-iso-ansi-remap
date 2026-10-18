import { runAction } from "./lib/run-action";

export default async function Command() {
  await runAction("uninstall", "⌨️ Autostart Removed: remap is off");
}
