import { runAction } from "./lib/run-action";

export default async function Command() {
  await runAction("on", "⌨️ Remap On: § is now ` ~, the key beside left ⇧ is Shift");
}
