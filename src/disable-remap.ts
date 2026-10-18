import { runAction } from "./lib/run-action";

export default async function Command() {
  await runAction("off", "⌨️ Remap Off: keys are back to ISO");
}
