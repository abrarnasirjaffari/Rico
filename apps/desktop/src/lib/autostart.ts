import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";

function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function getAutostartEnabled(): Promise<boolean> {
  if (!isTauriRuntime()) return false;
  try {
    return await isEnabled();
  } catch {
    return false;
  }
}

export async function toggleAutostart(nextState: boolean): Promise<boolean> {
  if (!isTauriRuntime()) return false;
  if (nextState) {
    await enable();
    return true;
  }
  await disable();
  return false;
}
