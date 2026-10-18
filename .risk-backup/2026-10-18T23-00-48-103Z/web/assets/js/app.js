import { api } from "./api.js";
import { h, mount } from "./dom.js";
import { renderCommands } from "./commands.js";
import { renderHome } from "./home.js";
import { applyStatus, startStatusPolling } from "./status.js";
import { renderTerms } from "./terms.js";
const outlet = document.getElementById("app");
const fallbackConfig = { name: "Risk", inviteUrl: null, supportUrl: null };
let config = fallbackConfig;
let cleanup = null;
let firstRender = true;
const TITLES = {
    "/": "Risk: tickets, logs and moderation for Discord",
    "/commands": "Commands · Risk",
    "/terms": "Terms of Service · Risk",
};
function normalize(path) {
    const trimmed = path.replace(/\/+$/, "");
    return trimmed === "" ? "/" : trimmed;
}
function notFound() {
    return h("div", { class: "view container page" }, h("h1", {}, "That page doesn't exist"), h("p", { class: "lede" }, "The link may be old or mistyped."), h("div", { class: "actions" }, h("a", { class: "btn btn-primary", href: "/", "data-link": true }, "Go to the home page")));
}
function render() {
    if (!outlet)
        return;
    cleanup?.();
    cleanup = null;
    const path = normalize(window.location.pathname);
    let node;
    switch (path) {
        case "/": {
            const home = renderHome(config);
            node = home.node;
            cleanup = home.cleanup;
            break;
        }
        case "/commands":
            node = renderCommands();
            break;
        case "/terms":
            node = renderTerms();
            break;
        default:
            node = notFound();
    }
    mount(outlet, node);
    document.title = TITLES[path] ?? "Page not found · Risk";
    document.querySelectorAll("nav a[data-link]").forEach((link) => {
        if (normalize(new URL(link.href).pathname) === path)
            link.setAttribute("aria-current", "page");
        else
            link.removeAttribute("aria-current");
    });
    applyStatus();
    if (!firstRender) {
        window.scrollTo(0, 0);
        const heading = node.querySelector("h1");
        if (heading) {
            heading.tabIndex = -1;
            heading.focus({ preventScroll: true });
        }
    }
    firstRender = false;
}
function navigate(url) {
    if (url.pathname + url.search === window.location.pathname + window.location.search) {
        render();
        return;
    }
    window.history.pushState({}, "", url.pathname + url.search);
    render();
}
document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return;
    const link = event.target?.closest("a[data-link]");
    if (!link)
        return;
    const url = new URL(link.href, window.location.origin);
    if (url.origin !== window.location.origin)
        return;
    event.preventDefault();
    navigate(url);
});
window.addEventListener("popstate", render);
async function start() {
    try {
        config = await api.config();
    }
    catch {
        config = fallbackConfig;
    }
    document.querySelectorAll("[data-invite]").forEach((link) => {
        if (config.inviteUrl)
            link.href = config.inviteUrl;
        else
            link.hidden = true;
    });
    render();
    startStatusPolling();
}
void start();
