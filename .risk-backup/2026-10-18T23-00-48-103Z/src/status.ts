import { api } from "./api.js";
import type { BotStatus } from "./types.js";

const POLL_MS = 30_000;
let latest: BotStatus | null = null;
let timer: number | undefined;

function labelFor(status: BotStatus | null): { state: string; label: string; details: string[] } {
  if (!status) return { state: "checking", label: "Checking status", details: [] };
  if (status.state === "online") {
    const details: string[] = [];
    if (status.latencyMs !== null) details.push(`${status.latencyMs} ms response`);
    if (status.guilds !== null) details.push(`${status.guilds.toLocaleString()} ${status.guilds === 1 ? "server" : "servers"}`);
    return { state: "online", label: "Risk is online", details };
  }
  if (status.state === "offline") return { state: "offline", label: "Risk is offline", details: ["Check again in a few minutes"] };
  return { state: "unknown", label: "Status unavailable", details: [] };
}

export function applyStatus(root: ParentNode = document): void {
  const { state, label, details } = labelFor(latest);
  root.querySelectorAll<HTMLElement>("[data-status-dot]").forEach((el) => (el.dataset.state = state));
  root.querySelectorAll<HTMLElement>("[data-status-label]").forEach((el) => (el.textContent = label));
  root.querySelectorAll<HTMLElement>("[data-status-details]").forEach((el) => {
    el.replaceChildren(
      ...details.map((text) => {
        const span = document.createElement("span");
        span.textContent = text;
        return span;
      }),
    );
  });
}

async function refresh(): Promise<void> {
  try {
    latest = await api.status();
  } catch {
    latest = { state: "unknown", latencyMs: null, guilds: null, checkedAt: Date.now() / 1000 };
  }
  applyStatus();
}

export function startStatusPolling(): void {
  void refresh();
  window.clearInterval(timer);
  timer = window.setInterval(() => {
    if (document.visibilityState === "visible") void refresh();
  }, POLL_MS);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void refresh();
  });
}
