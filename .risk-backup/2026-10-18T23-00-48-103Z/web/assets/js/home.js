import { h } from "./dom.js";
import { mountHero } from "./hero.js";
import { applyStatus } from "./status.js";
import { copyWithToast } from "./ui.js";
const FEATURES = [
    {
        name: "Tickets",
        text: "Post a panel once. Members press a button to open a private channel with your staff. Closing it saves a transcript to your log channel.",
        example: ",ticket 123456789012345678 @Staff",
    },
    {
        name: "Server logs",
        text: "Deleted and edited messages, voice joins and leaves, role changes, bans and new members, all in one channel.",
        example: ",logs #mod-log",
    },
    {
        name: "Welcome messages",
        text: "Greet new members in the channel you choose. Write New_user where the member's name should go and Risk turns it into a mention.",
        example: ",welcome 123456789012345678 Welcome New_user to Risk",
    },
    {
        name: "AI answers",
        text: "Ask a question and get a short answer. Code arrives in a highlighted block, or as a file when you name one.",
        example: ",ask make me a hello.lua",
    },
    {
        name: "Lookups",
        text: "Profiles, videos, repos and songs from TikTok, YouTube, GitHub and Spotify, shown as a clean embed.",
        example: ",github torvalds/linux",
    },
    {
        name: "Moderation",
        text: "Clear messages, kick, ban and unban, limited to members who already have the permission.",
        example: "!clear 20",
    },
];
function statusChip() {
    return h("div", { class: "status-chip", role: "status" }, h("span", { class: "status-dot", "data-status-dot": true, "data-state": "checking" }), h("strong", { "data-status-label": true }, "Checking status"), h("span", { class: "status-details", "data-status-details": true }));
}
export function renderHome(config) {
    const chatRoot = h("div", { class: "hero-chat" });
    const hero = h("section", { class: "hero container", "aria-labelledby": "hero-title" }, h("div", { class: "hero-copy" }, h("h1", { id: "hero-title" }, "Tickets, logs and moderation for your Discord server"), h("p", { class: "lede" }, "Risk opens private ticket channels, records deletes, edits and role changes, welcomes new members, answers questions with AI, and looks up TikTok, YouTube, GitHub and Spotify."), h("div", { class: "actions" }, config.inviteUrl ? h("a", { class: "btn btn-primary", href: config.inviteUrl, rel: "noopener" }, "Add Risk to your server") : null, h("a", { class: "btn btn-quiet", href: "/commands", "data-link": true }, "Browse commands")), h("p", { class: "fine" }, "Start a command with ", h("code", {}, "!"), ", ", h("code", {}, "?"), " or ", h("code", {}, ","), ". Whichever you prefer works.")), chatRoot);
    const tape = h("div", { class: "tape", "aria-label": "Live status" }, h("div", { class: "container tape-inner" }, statusChip()));
    const features = h("section", { class: "container features", "aria-labelledby": "features-title" }, h("h2", { id: "features-title" }, "What Risk does"), h("ul", { class: "feature-list" }, ...FEATURES.map((feature) => h("li", { class: "feature" }, h("h3", {}, feature.name), h("p", {}, feature.text), h("button", {
        class: "example",
        type: "button",
        title: "Copy this command",
        "aria-label": `Copy example: ${feature.example}`,
        onclick: () => void copyWithToast(feature.example),
    }, h("code", {}, feature.example))))), h("p", { class: "features-note" }, "Click an example to copy it. Type !commands in your server for the full list, or see ", h("a", { href: "/commands", "data-link": true }, "every command here"), "."));
    const node = h("div", { class: "view" }, hero, tape, features);
    const stopHero = mountHero(chatRoot);
    applyStatus(node);
    return { node, cleanup: stopHero };
}
