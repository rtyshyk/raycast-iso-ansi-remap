// Minimal stand-in for @raycast/api: enough to import the commands and call their pure helpers.
import path from "node:path";
import { vi } from "vitest";

export const environment = { assetsPath: path.resolve("assets"), isDevelopment: false };

export const showHUD = vi.fn(async () => {});
export const showToast = vi.fn(async (options: Record<string, unknown>) => ({ ...options, hide: vi.fn() }));
export const Toast = { Style: { Animated: "animated", Success: "success", Failure: "failure" } };

export const Color = { Green: "green", Orange: "orange", SecondaryText: "secondaryText" };
export const Icon = new Proxy({}, { get: (_, name) => String(name) });
export const Keyboard = { Shortcut: { Common: { Refresh: { modifiers: ["cmd"], key: "r" } } } };

const component = () => null;
export const Detail = Object.assign(component, {
  Metadata: Object.assign(component, {
    Label: component,
    Separator: component,
    TagList: Object.assign(component, { Item: component }),
  }),
});
export const ActionPanel = component;
export const Action = Object.assign(component, { ShowInFinder: component, Style: { Destructive: "destructive" } });
