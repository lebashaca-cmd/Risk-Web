import { api } from "./api.js";
import { prefersReduced } from "./anim.js";
const POLL_MS = 30_000;
let latest = null;
let timer;
const lastShown = new Map();
function viewFor(status) {
    if (!status)
        return { state: "checking", label: "Checking status", details: [], note: null };
    if (status.state === "online") {
        const details = [];
        if (status.latencyMs !== null)
            details.push({ key: "latency", value: status.latencyMs, suffix: " ms response" });
        if (status.guilds !== null)
            details.push({ key: "guilds", value: status.guilds, suffix: status.guilds === 1 ? " server" : " servers" });
        return { state: "online", label: "Risk is online", details, note: null };
    }
    if (status.state === "offline")
        return { state: "offline", label: "Risk is offline", details: [], note: "Check again in a few minutes" };
    return { state: "unknown", label: "Status unavailable", details: [], note: null };
}
function countTo(el, key, to) {
    const from = lastShown.get(key);
    lastShown.set(key, to);
    if (prefersReduced() || from === to) {
        el.textContent = to.toLocaleString();
        return;
    }
    const start = from ?? 0;
    const t0 = performance.now();
    const duration = 800;
    el.textContent = start.toLocaleString();
    const step = (now) => {
        const p = Math.min(1, (now - t0) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(start + (to - start) * eased).toLocaleString();
        if (p < 1 && el.isConnected)
            requestAnimationFrame(step);
        else
            el.textContent = to.toLocaleString();
    };
    requestAnimationFrame(step);
}
export function applyStatus(root = document) {
    const { state, label, details, note } = viewFor(latest);
    root.querySelectorAll("[data-status-dot]").forEach((el) => (el.dataset.state = state));
    root.querySelectorAll("[data-status-label]").forEach((el) => (el.textContent = label));
    root.querySelectorAll("[data-status-details]").forEach((el) => {
        const spans = details.map((detail) => {
            const span = document.createElement("span");
            const number = document.createElement("b");
            number.className = "num";
            span.append(number, detail.suffix);
            countTo(number, detail.key, detail.value);
            return span;
        });
        if (note) {
            const span = document.createElement("span");
            span.textContent = note;
            spans.push(span);
        }
        el.replaceChildren(...spans);
    });
}
async function refresh() {
    try {
        latest = await api.status();
    }
    catch {
        latest = { state: "unknown", latencyMs: null, guilds: null, checkedAt: Date.now() / 1000 };
    }
    applyStatus();
}
export function startStatusPolling() {
    void refresh();
    window.clearInterval(timer);
    timer = window.setInterval(() => {
        if (document.visibilityState === "visible")
            void refresh();
    }, POLL_MS);
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible")
            void refresh();
    });
}
