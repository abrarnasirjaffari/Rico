import { useCallback, useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Loader2, LogOut, RefreshCw, ShieldCheck, X } from "lucide-react";
import { ConnectView } from "./components/ConnectView";
import { SpendPopover } from "./components/SpendPopover";
import {
  checkSession,
  fetchPopoverSnapshot,
  getSavedServerUrl,
  logout,
  type PopoverSnapshot,
  type RicoUser,
} from "./lib/ricoClient";

export function App() {
  const [serverUrl, setServerUrl] = useState<string>(() => getSavedServerUrl());
  const [user, setUser] = useState<RicoUser | null>(null);
  const [checkingSession, setCheckingSession] = useState<boolean>(true);
  const [snapshot, setSnapshot] = useState<PopoverSnapshot | null>(null);
  const [loadingSnapshot, setLoadingSnapshot] = useState<boolean>(false);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);

  const loadSnapshot = useCallback(
    async (targetUrl: string) => {
      setLoadingSnapshot(true);
      setSnapshotError(null);
      try {
        const data = await fetchPopoverSnapshot(targetUrl);
        setSnapshot(data);
      } catch (err) {
        if (err instanceof Error && err.name === "UnauthorizedError") {
          setUser(null);
          setSnapshot(null);
          return;
        }
        setSnapshotError(
          err instanceof Error ? err.message : "Failed to sync Rico data."
        );
      } finally {
        setLoadingSnapshot(false);
      }
    },
    []
  );

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const result = await checkSession(serverUrl);
        if (!active) return;
        if (result.authenticated && result.user) {
          setUser(result.user);
          await loadSnapshot(serverUrl);
        } else {
          setUser(null);
        }
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setCheckingSession(false);
      }
    })();

    return () => {
      active = false;
    };
    // Initial startup check only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll live burn & holds every 30s while signed in, and refresh on window focus
  useEffect(() => {
    if (!user) return;
    const interval = window.setInterval(() => {
      void loadSnapshot(serverUrl);
    }, 30_000);
    const onFocus = () => {
      void loadSnapshot(serverUrl);
    };
    window.addEventListener("focus", onFocus);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [user, serverUrl, loadSnapshot]);

  const handleHideToTray = async () => {
    try {
      await getCurrentWindow().hide();
    } catch {
      // Safe no-op when previewed outside Tauri webview
    }
  };

  const handleSignOut = async () => {
    try {
      await logout(serverUrl);
    } catch {
      // Clear local state even if server is unreachable
    }
    setUser(null);
    setSnapshot(null);
    setSnapshotError(null);
  };

  return (
    <div className="flex h-full w-full flex-col justify-between overflow-hidden rounded-xl border border-[#DCE7F3] bg-[#F8FAFC] text-[#0F172A] shadow-lg">
      <header
        data-tauri-drag-region
        className="flex cursor-grab items-center justify-between border-b border-[#E2ECF6] bg-white px-4 py-3 active:cursor-grabbing"
      >
        <div data-tauri-drag-region className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2563EB] text-white shadow-sm">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold leading-none tracking-tight">
              Rico Desktop
            </h1>
            <p className="mt-0.5 text-[11px] text-[#52637A]">
              {user ? user.email : "Spend Monitor & Guardrails"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {user && (
            <>
              <button
                type="button"
                onClick={() => void loadSnapshot(serverUrl)}
                disabled={loadingSnapshot}
                title="Refresh spend & holds"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[#64748B] transition-colors hover:bg-[#F1F5F9] hover:text-[#0F172A] disabled:opacity-60"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${
                    loadingSnapshot ? "animate-spin text-[#2563EB]" : ""
                  }`}
                />
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                title="Sign out"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[#64748B] transition-colors hover:bg-[#F1F5F9] hover:text-[#0F172A]"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={handleHideToTray}
            title="Hide to system tray"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#64748B] transition-colors hover:bg-[#F1F5F9] hover:text-[#0F172A]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="flex flex-1 flex-col overflow-hidden">
        {checkingSession ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-xs text-[#52637A]">
            <Loader2 className="h-5 w-5 animate-spin text-[#2563EB]" />
            <span>Connecting to {serverUrl}…</span>
          </div>
        ) : user ? (
          <SpendPopover
            serverUrl={serverUrl}
            snapshot={snapshot}
            loading={loadingSnapshot}
            error={snapshotError}
            onRefresh={() => loadSnapshot(serverUrl)}
            onUnauthorized={() => {
              setUser(null);
              setSnapshot(null);
            }}
          />
        ) : (
          <ConnectView
            serverUrl={serverUrl}
            onServerUrlChange={setServerUrl}
            onAuthenticated={(authedUser, activeUrl) => {
              setServerUrl(activeUrl);
              setUser(authedUser);
              void loadSnapshot(activeUrl);
            }}
          />
        )}
      </main>

      <footer className="flex items-center justify-between border-t border-[#E2ECF6] bg-white px-4 py-2 text-[11px] text-[#64748B]">
        <span className="max-w-[230px] truncate font-mono">{serverUrl}</span>
        <span className="flex items-center gap-1.5">
          <span
            className={`h-2 w-2 rounded-full ${
              user ? "bg-[#16A34A]" : "bg-[#CBD5E1]"
            }`}
          />
          {user ? "Live" : "Offline"}
        </span>
      </footer>
    </div>
  );
}

export default App;
