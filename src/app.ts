import { api } from "./api.js";
import { initMotionFlag, prefersReduced } from "./anim.js";
import { h, mount } from "./dom.js";
import { renderCommands } from "./commands.js";
import { renderHome } from "./home.js";
import { applyStatus, startStatusPolling } from "./status.js";
import { renderTerms } from "./terms.js";
import type { SiteConfig } from "./types.js";

const outlet = document.getElementById("app");
const fallbackConfig: SiteConfig = { name: "Risk", inviteUrl: null, supportUrl: null };
let config: SiteConfig = fallbackConfig;
let cleanup: (() => void) | null = null;
let firstRender = true;

const TITLES: Record<string, string> = {
  "/": "Risk: tickets, logs and moderation for Discord",
  "/commands": "Commands · Risk",
  "/terms": "Terms of Service · Risk",
};

function normalize(path: string): string {
  const trimmed = path.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

function notFound(): HTMLElement {
  return h(
    "div",
    { class: "view container page" },
    h("h1", {}, "That page doesn't exist"),
    h("p", { class: "lede" }, "The link may be old or mistyped."),
    h("div", { class: "actions" }, h("a", { class: "btn btn-primary", href: "/", "data-link": true }, "Go to the home page")),
  );
}

function render(): void {
  if (!outlet) return;
  cleanup?.();
  cleanup = null;

  const path = normalize(window.location.pathname);
  let node: HTMLElement;
  switch (path) {
    case "/": {
      const home = renderHome(config);
      node = home.node;
      cleanup = home.cleanup;
      break;
    }
    case "/commands": {
      const view = renderCommands();
      node = view.node;
      cleanup = view.cleanup;
      break;
    }
    case "/terms": {
      const view = renderTerms();
      node = view.node;
      cleanup = view.cleanup;
      break;
    }
    default:
      node = notFound();
  }

  mount(outlet, node);
  document.title = TITLES[path] ?? "Page not found · Risk";
  document.querySelectorAll<HTMLAnchorElement>("nav a[data-link]").forEach((link) => {
    if (normalize(new URL(link.href).pathname) === path) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  applyStatus();

  if (!firstRender) {
    window.scrollTo(0, 0);
    const heading = node.querySelector<HTMLElement>("h1");
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  }
  firstRender = false;
}

function transition(update: () => void): void {
  const doc = document as Document & { startViewTransition?: (callback: () => void) => unknown };
  if (doc.startViewTransition && !prefersReduced()) doc.startViewTransition(update);
  else update();
}

function navigate(url: URL): void {
  if (url.pathname + url.search === window.location.pathname + window.location.search) {
    transition(render);
    return;
  }
  window.history.pushState({}, "", url.pathname + url.search);
  transition(render);
}

document.addEventListener("click", (event) => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = (event.target as Element | null)?.closest<HTMLAnchorElement>("a[data-link]");
  if (!link) return;
  const url = new URL(link.href, window.location.origin);
  if (url.origin !== window.location.origin) return;
  event.preventDefault();
  navigate(url);
});

window.addEventListener("popstate", () => transition(render));

function watchHeader(): void {
  const header = document.querySelector<HTMLElement>(".site-header");
  if (!header || !("IntersectionObserver" in window)) return;
  const sentinel = document.createElement("div");
  sentinel.setAttribute("aria-hidden", "true");
  sentinel.style.cssText = "position:absolute;top:0;left:0;width:1px;height:24px;pointer-events:none";
  document.body.prepend(sentinel);
  new IntersectionObserver(([entry]) => header.classList.toggle("is-stuck", !!entry && !entry.isIntersecting)).observe(sentinel);
}

async function start(): Promise<void> {
  initMotionFlag();
  watchHeader();
  try {
    config = await api.config();
  } catch {
    config = fallbackConfig;
  }
  document.querySelectorAll<HTMLAnchorElement>("[data-invite]").forEach((link) => {
    if (config.inviteUrl) link.href = config.inviteUrl;
    else link.hidden = true;
  });
  render();
  startStatusPolling();
}

void start();
