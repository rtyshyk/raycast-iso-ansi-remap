import { Action, ActionPanel, Color, Detail, Icon, Keyboard, showToast, Toast } from "@raycast/api";
import { showFailureToast, usePromise } from "@raycast/utils";
import { getStatus, keyremap, KeyremapAction, RemapStatus, scriptPath } from "./lib/keyremap";

const REMAP_LABEL: Record<RemapStatus["remap"], { text: string; color: Color }> = {
  on: { text: "On", color: Color.Green },
  off: { text: "Off", color: Color.SecondaryText },
  partial: { text: "Partly On", color: Color.Orange },
};

const AUTOSTART_LABEL: Record<RemapStatus["autostart"], { text: string; color: Color }> = {
  on: { text: "Installed", color: Color.Green },
  off: { text: "Not Installed", color: Color.SecondaryText },
  "not-loaded": { text: "Installed, Not Loaded", color: Color.Orange },
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

If something looks wrong, this turns the remap off from Terminal:

\`\`\`
/bin/bash "${script}" off
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

  async function run(action: KeyremapAction, title: string) {
    const toast = await showToast({ style: Toast.Style.Animated, title: `${title}…` });
    try {
      toast.message = await keyremap(action);
      toast.style = Toast.Style.Success;
      toast.title = title;
    } catch (error) {
      await toast.hide();
      await showFailureToast(error, { title: "Key remap failed" });
    }
    revalidate();
  }

  const remapAction =
    status?.remap === "on" ? (
      <Action title="Disable Remap" icon={Icon.XMarkCircle} onAction={() => run("off", "Remap Off")} />
    ) : (
      <Action title="Enable Remap" icon={Icon.CheckCircle} onAction={() => run("on", "Remap On")} />
    );
  const autostartAction =
    status?.autostart === "on" ? (
      <Action
        title="Remove Autostart"
        icon={Icon.Trash}
        style={Action.Style.Destructive}
        onAction={() => run("uninstall", "Autostart Removed")}
      />
    ) : (
      <Action title="Install Autostart" icon={Icon.Power} onAction={() => run("install", "Autostart Installed")} />
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
            <Detail.Metadata.TagList title="Autostart">
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
          {remapAction}
          {autostartAction}
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
