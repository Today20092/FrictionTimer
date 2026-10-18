import { isTauri } from "@tauri-apps/api/core";
import { getSystemTheme } from "./friction/api";

export function initializeSystemTheme(): void {
  if (!isTauri()) return;
  let request = 0;
  const refresh = async () => {
    if (document.hidden) return;
    const current = ++request;
    try {
      const theme = await getSystemTheme();
      if (current !== request || !theme) return;
      for (const [name, color] of Object.entries(theme.colors)) {
        if (/^[a-z-]+$/.test(name) && /^#[0-9a-f]{6}$/i.test(color)) {
          document.documentElement.style.setProperty(`--${name}`, color);
        }
      }
      document.documentElement.classList.toggle("dark", theme.dark);
      document.documentElement.style.colorScheme = theme.dark ? "dark" : "light";
    } catch (error) {
      console.warn("Could not read Android theme; keeping current colors.", error);
    }
  };
  void refresh();
  window.addEventListener("focus", () => void refresh());
  document.addEventListener("visibilitychange", () => void refresh());
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => void refresh());
}
