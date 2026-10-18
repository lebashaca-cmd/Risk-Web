import { h } from "./dom.js";
import { prefersReduced } from "./anim.js";
const EVENTS = [
    { bar: "red", title: "Message Deleted", text: "mara in #general" },
    { bar: "green", title: "Joined Voice", text: "kai joined Lounge" },
    { bar: "orange", title: "Message Edited", text: "jules in #dev" },
    { bar: "green", title: "Role Added", text: "sam was given Member" },
    { bar: "green", title: "Member Joined", text: "Account created 2 years ago" },
    { bar: "red", title: "Ticket Closed", text: "ticket-lena closed, transcript saved" },
    { bar: "blue", title: "Nickname Changed", text: "Ari is now Ari K" },
    { bar: "red", title: "Left Voice", text: "kai left Lounge" },
];
const VISIBLE = 5;
const EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)";
function entry(event) {
    return h("li", { class: `log-item bar-${event.bar}` }, h("div", { class: "log-title" }, event.title), h("div", { class: "log-text" }, event.text));
}
function push(list, event) {
    const before = new Map();
    Array.from(list.children).forEach((child) => before.set(child, child.getBoundingClientRect().top));
    const item = entry(event);
    list.prepend(item);
    while (list.children.length > VISIBLE)
        list.lastElementChild?.remove();
    before.forEach((top, el) => {
        if (!el.isConnected)
            return;
        const delta = top - el.getBoundingClientRect().top;
        if (delta)
            el.animate([{ transform: `translateY(${delta}px)` }, { transform: "none" }], { duration: 400, easing: EASE });
    });
    item.animate([
        { opacity: 0, transform: "translateY(-14px) scale(0.98)" },
        { opacity: 1, transform: "none" },
    ], { duration: 400, easing: EASE });
}
export function mountLogFeed(root) {
    const list = h("ul", { class: "log-list" });
    root.replaceChildren(h("div", { class: "log-head" }, h("span", { class: "hash" }, "#"), h("span", {}, "mod-log")), list);
    let index = 0;
    const next = () => EVENTS[index++ % EVENTS.length];
    for (let i = 0; i < VISIBLE - 1; i++)
        list.append(entry(next()));
    if (prefersReduced() || !("IntersectionObserver" in window))
        return () => undefined;
    let timer;
    const start = () => {
        if (timer !== undefined)
            return;
        timer = window.setInterval(() => {
            if (document.visibilityState === "visible")
                push(list, next());
        }, 2600);
    };
    const stop = () => {
        window.clearInterval(timer);
        timer = undefined;
    };
    const observer = new IntersectionObserver((entries) => entries.forEach((e) => (e.isIntersecting ? start() : stop())), { threshold: 0.2 });
    observer.observe(root);
    return () => {
        stop();
        observer.disconnect();
    };
}
