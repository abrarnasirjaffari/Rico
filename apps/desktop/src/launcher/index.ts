import { invoke } from "@tauri-apps/api/core";

export { CommandLauncher } from "./CommandLauncher";
export {
  askRicoLauncher,
  confirmLauncherQuote,
  parseChatSsePayload,
  type LauncherQuote,
  type LauncherReply,
} from "./launcherClient";

export async function openCommandLauncherWindow(): Promise<void> {
  if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
    await invoke("open_command_launcher");
  }
}
