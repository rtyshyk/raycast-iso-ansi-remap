import { disableRemap, runAction } from "./lib/run-action";

export default async function Command() {
  await runAction(disableRemap);
}
