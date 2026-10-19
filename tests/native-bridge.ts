import type { Page } from "@playwright/test";
import type { FrictionApp, FrictionAppDefaults, ServiceStatus } from "../src/lib/friction/types";

export const savedApp: FrictionApp = {
  id: "saved-app",
  appId: "com.example.reader",
  name: "Reader",
  waitSeconds: 20,
  durationSeconds: 300,
  reminderEnabled: false,
  reminderIntervalMinutes: 10,
  messages: ["Take a breath."],
};

// Only the native IPC boundary is replaced; tests exercise the real UI and hooks.
export async function mockNativeBridge(page: Page) {
  const state = {
    apps: [{ ...savedApp, messages: [...savedApp.messages] }],
    defaults: {} as FrictionAppDefaults,
    failures: new Set<string>(),
    permissions: { overlay: true, accessibility: true, notifications: true } as ServiceStatus,
    installed: [savedApp, { appId: "com.example.notes", name: "Notes" }, { appId: "com.instagram.android", name: "Instagram" }],
    delay: 0,
  };
  await page.exposeFunction("testInvoke", async (command: string, args: Record<string, unknown> = {}) => {
    if (state.delay) await new Promise((resolve) => setTimeout(resolve, state.delay));
    if (state.failures.has(command)) throw new Error("Temporarily unavailable");
    switch (command) {
      case "get_system_theme": return null;
      case "list_apps": return state.apps;
      case "get_app": return state.apps.find((app) => app.id === args.id) ?? null;
      case "get_app_defaults": return state.defaults;
      case "set_app_defaults":
        state.defaults = args.defaults as FrictionAppDefaults;
        return state.defaults;
      case "apply_app_defaults": {
        const input = args.input as { appIds: string[]; defaults: FrictionAppDefaults };
        for (const app of state.apps.filter(item => input.appIds.includes(item.id))) {
          const defaults = input.defaults;
          if (defaults.waitSeconds !== undefined) app.waitSeconds = defaults.waitSeconds;
          if (defaults.durationSeconds !== undefined) app.durationSeconds = defaults.durationSeconds;
          if (defaults.messages !== undefined) app.messages = [...defaults.messages];
          if (defaults.sessionReminders !== undefined) {
            app.reminderEnabled = defaults.sessionReminders.enabled;
            app.reminderIntervalMinutes = defaults.sessionReminders.intervalMinutes;
          }
        }
        return input.appIds.length;
      }
      case "create_app": {
        const app = { ...(args.input as Omit<FrictionApp, "id">), id: "new-app" };
        state.apps.push(app);
        return app;
      }
      case "delete_app":
        state.apps = state.apps.filter((app) => app.id !== args.id);
        return;
      case "update_app": {
        const app = state.apps.find((app) => app.id === args.id);
        if (!app) throw new Error("App not found");
        Object.assign(app, args.patch);
        return app;
      }
      case "list_installed_apps":
        return state.installed
          .filter((app) => app.name.toLowerCase().includes(String(args.query ?? "").toLowerCase()));
      case "get_service_status": return state.permissions;
      case "open_service_settings": return;
      default: throw new Error(`Unexpected native command: ${command}`);
    }
  });
  await page.addInitScript(() => {
    Object.assign(window, {
      __TAURI_INTERNALS__: {
        invoke: (command: string, args: unknown) =>
          (window as unknown as { testInvoke: (command: string, args: unknown) => Promise<unknown> }).testInvoke(command, args),
      },
    });
  });
  return state;
}
