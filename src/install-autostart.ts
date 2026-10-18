import { runAction } from "./lib/run-action";

export default async function Command() {
  await runAction("install", "⌨️ Autostart Installed: remap is on now and at every login");
}
