import { enableRemap, runAction } from "./lib/run-action";

export default async function Command() {
  await runAction(enableRemap);
}
