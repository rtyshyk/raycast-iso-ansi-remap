import {
  Action,
  ActionPanel,
  Color,
  Detail,
  Icon,
  Keyboard,
  openExtensionPreferences,
  showToast,
  Toast,
} from "@raycast/api";
import { showFailureToast, usePromise } from "@raycast/utils";
import { getStatus, RemapStatus, scriptPath } from "./lib/keyremap";
import { disableRemap, enableRemap } from "./lib/run-action";

const REMAP_LABEL: Record<RemapStatus["remap"], { text: string; color: Color }> = {
  on: { text: "On", color: Color.Green },
  off: { text: "Off", color: Color.SecondaryText },
  partial: { text: "Partly On", color: Color.Orange },
};

const AUTOSTART_LABEL: Record<RemapStatus["autostart"], { text: string; color: Color }> = {
  on: { text: "Stays On", color: Color.Green },
  off: { text: "Off", color: Color.SecondaryText },
  "not-loaded": { text: "LaunchAgent Not Loaded", color: Color.Orange },
};

export function statusMarkdown(status: RemapStatus | undefined, script: string) {
  const state = status ? `**Remap:** ${REMAP_LABEL[status.remap].text.toLowerCase()}` : "Reading the key mapping…";
  return `# ISO to ANSI Keyboard Remap

${state}

| Key on the built-in keyboard | Remap off | Remap on |
| --- | --- | --- |
| Left of 1 | § ± | \` ~ |
| Right of the short left Shift | \` ~ | Shift |

Only the built-in keyboard changes. External keyboards and your other remaps (for example Caps Lock) stay as they are.

If something looks wrong, this turns the remap off and removes its LaunchAgent, from Terminal:

\`\`\`
/bin/bash "${script}" uninstall
\`\`\`
`;
}

export default function Command() {
  const {
    data: status,
    isLoading,
    revalidate,
  } = usePromise(getStatus, [], {
    failureToastOptions: { title: "Could not read the key mapping" },
  });

  async function run(action: () => Promise<string>, pending: string) {
    const toast = await showToast({ style: Toast.Style.Animated, title: pending });
    try {
      toast.title = await action();
      toast.style = Toast.Style.Success;
    } catch (error) {
      await toast.hide();
      await showFailureToast(error, { title: "Key remap failed" });
    }
    revalidate();
  }

  const enable = (
    <Action title="Enable Remap" icon={Icon.CheckCircle} onAction={() => run(enableRemap, "Turning remap on…")} />
  );
  const disable = (
    <Action title="Disable Remap" icon={Icon.XMarkCircle} onAction={() => run(disableRemap, "Turning remap off…")} />
  );

  return (
    <Detail
      isLoading={isLoading}
      markdown={statusMarkdown(status, scriptPath())}
      metadata={
        status && (
          <Detail.Metadata>
            <Detail.Metadata.TagList title="Remap">
              <Detail.Metadata.TagList.Item
                text={REMAP_LABEL[status.remap].text}
                color={REMAP_LABEL[status.remap].color}
              />
            </Detail.Metadata.TagList>
            <Detail.Metadata.TagList title="After Restart">
              <Detail.Metadata.TagList.Item
                text={AUTOSTART_LABEL[status.autostart].text}
                color={AUTOSTART_LABEL[status.autostart].color}
              />
            </Detail.Metadata.TagList>
            <Detail.Metadata.Separator />
            {status.rules.length === 0 ? (
              <Detail.Metadata.Label title="Active Rules" text="None" />
            ) : (
              status.rules.map((rule, index) => (
                <Detail.Metadata.Label
                  key={`${rule.src}:${rule.dst}`}
                  title={index === 0 ? "Active Rules" : ""}
                  text={`${rule.src} → ${rule.dst}`}
                />
              ))
            )}
          </Detail.Metadata>
        )
      }
      actions={
        <ActionPanel>
          {status?.remap === "on" ? disable : enable}
          {status?.remap === "on" ? enable : disable}
          <Action title="Open Extension Preferences" icon={Icon.Gear} onAction={openExtensionPreferences} />
          <Action
            title="Refresh"
            icon={Icon.ArrowClockwise}
            shortcut={Keyboard.Shortcut.Common.Refresh}
            onAction={revalidate}
          />
          {status && status.autostart !== "off" && (
            <Action.ShowInFinder title="Show LaunchAgent in Finder" icon={Icon.Finder} path={status.agent} />
          )}
        </ActionPanel>
      }
    />
  );
}
