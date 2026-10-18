import { h } from "./dom.js";
import { playIntro, revealOnScroll, splitWords } from "./anim.js";
import { mountHero } from "./hero.js";
import { icon, type IconName } from "./icons.js";
import { mountLogFeed } from "./logfeed.js";
import { applyStatus } from "./status.js";
import { copyWithToast, flashCopied } from "./ui.js";
import type { SiteConfig } from "./types.js";

interface Feature {
  name: string;
  icon: IconName;
  text: string;
  example: string;
}

const FEATURES: Feature[] = [
  {
    name: "Tickets",
    icon: "ticket",
    text: "Post a panel once. Members press a button to open a private channel with your staff. Closing it saves a transcript to your log channel.",
    example: ",ticket 123456789012345678 @Staff",
  },
  {
    name: "Server logs",
    icon: "logs",
    text: "Deleted and edited messages, voice joins and leaves, role changes, bans and new members, all in one channel.",
    example: ",logs #mod-log",
  },
  {
    name: "Welcome messages",
    icon: "welcome",
    text: "Greet new members in the channel you choose. Write New_user where the member's name should go and Risk turns it into a mention.",
    example: ",welcome 123456789012345678 Welcome New_user to Risk",
  },
  {
    name: "AI answers",
    icon: "ai",
    text: "Ask a question and get a short answer. Code arrives in a highlighted block, or as a file when you name one.",
    example: ",ask make me a hello.lua",
  },
  {
    name: "Lookups",
    icon: "lookup",
    text: "Profiles, videos, repos and songs from TikTok, YouTube, GitHub and Spotify, shown as a clean embed.",
    example: ",github torvalds/linux",
  },
  {
    name: "Moderation",
    icon: "shield",
    text: "Clear messages, kick, ban and unban, limited to members who already have the permission.",
    example: "!clear 20",
  },
];

function copyButton(example: string): HTMLElement {
  const button = h(
    "button",
    {
      class: "example",
      type: "button",
      title: "Copy this command",
      "aria-label": `Copy example: ${example}`,
      onclick: () => {
        flashCopied(button);
        void copyWithToast(example);
      },
    },
    h("code", {}, example),
  );
  return button;
}

function statusChip(): HTMLElement {
  return h(
    "div",
    { class: "status-chip", role: "status" },
    h("span", { class: "status-dot", "data-status-dot": true, "data-state": "checking" }),
    h("strong", { "data-status-label": true }, "Checking status"),
    h("span", { class: "status-details", "data-status-details": true }),
  );
}

export function renderHome(config: SiteConfig): { node: HTMLElement; cleanup: () => void } {
  const chatRoot = h("div", { class: "hero-chat", "data-step": true, style: "--s:4" });
  const title = h("h1", { id: "hero-title" }, "Tickets, logs and moderation for your Discord server");
  splitWords(title);

  const hero = h(
    "section",
    { class: "hero-wrap", "aria-labelledby": "hero-title" },
    h(
      "div",
      { class: "hero container" },
      h(
        "div",
        { class: "hero-copy" },
        title,
        h(
          "p",
          { class: "lede", "data-step": true, style: "--s:1" },
          "Risk opens private ticket channels, records deletes, edits and role changes, welcomes new members, answers questions with AI, and looks up TikTok, YouTube, GitHub and Spotify.",
        ),
        h(
          "div",
          { class: "actions", "data-step": true, style: "--s:2" },
          config.inviteUrl ? h("a", { class: "btn btn-primary", href: config.inviteUrl, rel: "noopener" }, "Add Risk to your server") : null,
          h("a", { class: "btn btn-quiet", href: "/commands", "data-link": true }, "Browse commands"),
        ),
        h(
          "p",
          { class: "fine", "data-step": true, style: "--s:3" },
          "Start a command with ",
          h("code", {}, "!"),
          ", ",
          h("code", {}, "?"),
          " or ",
          h("code", {}, ","),
          ". Whichever you prefer works.",
        ),
      ),
      chatRoot,
    ),
  );

  const tape = h("div", { class: "tape", "aria-label": "Live status" }, h("div", { class: "container tape-inner" }, statusChip()));

  const features = h(
    "section",
    { class: "container features", "aria-labelledby": "features-title" },
    h("h2", { id: "features-title" }, "What Risk does"),
    h(
      "ul",
      { class: "feature-list" },
      ...FEATURES.map((feature) =>
        h(
          "li",
          { class: "feature" },
          h("div", { class: "feature-head" }, icon(feature.icon), h("h3", {}, feature.name)),
          h("p", {}, feature.text),
          copyButton(feature.example),
        ),
      ),
    ),
    h(
      "p",
      { class: "features-note" },
      "Click an example to copy it. Type !commands in your server for the full list, or see ",
      h("a", { href: "/commands", "data-link": true }, "every command here"),
      ".",
    ),
  );

  const feedRoot = h("div", { class: "logfeed", "aria-hidden": "true" });
  const logs = h(
    "section",
    { class: "logs", "aria-labelledby": "logs-title" },
    h(
      "div",
      { class: "container logs-grid" },
      h(
        "div",
        { class: "logs-copy" },
        h("h2", { id: "logs-title" }, "Every change leaves a record"),
        h(
          "p",
          { class: "lede" },
          "Risk posts deleted and edited messages, voice and role changes, joins, leaves and bans to the channel you pick, so moderators never have to ask what happened.",
        ),
        copyButton(",logs #mod-log"),
        h("p", { class: "fine" }, "The feed shows example events. Your server shows its own."),
      ),
      feedRoot,
    ),
  );

  const cta = h(
    "section",
    { class: "cta", "aria-labelledby": "cta-title" },
    h(
      "div",
      { class: "container cta-inner" },
      h("h2", { id: "cta-title" }, "Put Risk in your server"),
      h("p", {}, "It takes one click to add. Then post your first ticket panel."),
      h(
        "div",
        { class: "actions" },
        config.inviteUrl ? h("a", { class: "btn btn-primary", href: config.inviteUrl, rel: "noopener" }, "Add Risk to your server") : null,
        h("a", { class: "btn btn-quiet", href: "/commands", "data-link": true }, "Browse commands"),
      ),
    ),
  );

  const node = h("div", { class: "view intro" }, hero, tape, features, logs, cta);

  const stopHero = mountHero(chatRoot);
  const stopFeed = mountLogFeed(feedRoot);
  const stopReveal = revealOnScroll(node, ".feature");
  applyStatus(node);
  playIntro(node);

  return {
    node,
    cleanup: () => {
      stopHero();
      stopFeed();
      stopReveal();
    },
  };
}
