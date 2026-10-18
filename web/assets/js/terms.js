import { api } from "./api.js";
import { h, mount } from "./dom.js";
export function renderTerms() {
    const body = h("div", { class: "prose" }, h("p", { class: "muted" }, "Loading terms"));
    const node = h("div", { class: "view container page" }, h("h1", {}, "Terms of Service"), body);
    api
        .tos()
        .then((tos) => {
        if (!tos.sections.length) {
            mount(body, h("p", { class: "empty" }, "The terms aren't published yet."));
            return;
        }
        mount(body, tos.updated ? h("p", { class: "muted" }, `Last updated ${tos.updated}`) : null, ...tos.sections.flatMap((section) => [h("h2", {}, section.title), h("p", {}, section.text)]));
    })
        .catch(() => mount(body, h("p", { class: "empty" }, "The terms didn't load. Refresh the page and try again.")));
    return node;
}
