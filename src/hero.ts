import { h } from "./dom.js";

interface Scenario {
  id: string;
  label: string;
  command: string;
  reply: () => Node[];
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function embed(bar: string, title: string, description: string | null, fields: [string, string][], footer?: string): HTMLElement {
  return h(
    "div",
    { class: `embed bar-${bar}` },
    h("div", { class: "embed-title" }, title),
    description ? h("div", { class: "embed-desc" }, description) : null,
    fields.length
      ? h(
          "div",
          { class: "embed-fields" },
          ...fields.map(([name, value], i) =>
            h("div", { class: "embed-field", style: `--f:${i}` }, h("div", { class: "embed-field-name" }, name), h("div", {}, value)),
          ),
        )
      : null,
    footer ? h("div", { class: "embed-footer" }, footer) : null,
  );
}

const SCENARIOS: Scenario[] = [
  {
    id: "tickets",
    label: "Tickets",
    command: ",ticket 123456789012345678 @Staff",
    reply: () => [
      embed(
        "blurple",
        "🎫 Support Tickets",
        "Need help? Press the button below to open a private ticket. @Staff will be notified as soon as you open one.",
        [],
        "One open ticket per person.",
      ),
      h("div", { class: "button-row" }, h("span", { class: "dbtn" }, "🎫 Open Ticket")),
    ],
  },
  {
    id: "lookups",
    label: "Lookups",
    command: ",github adalin",
    reply: () => [
      embed("grey", "Ada Lin (adalin)", "Compilers and tiny tools.", [
        ["Followers", "1,284"],
        ["Following", "31"],
        ["Public Repos", "42"],
        ["Location", "Lisbon"],
      ]),
    ],
  },
  {
    id: "ai",
    label: "AI answers",
    command: ",ask write hello world in lua",
    reply: () => [
      h("div", { class: "msg-text" }, "Here you go:"),
      h("div", { class: "codeblock" }, h("span", { class: "codelang" }, "lua"), h("code", {}, 'print("Hello, world!")')),
    ],
  },
];

function avatar(kind: "user" | "bot", name: string): HTMLElement {
  return h("div", { class: `avatar ${kind}`, "aria-hidden": "true" }, name.charAt(0).toUpperCase());
}

function message(kind: "user" | "bot", ...body: Node[]): HTMLElement {
  const name = kind === "bot" ? "Risk" : "mara";
  return h(
    "div",
    { class: "msg" },
    avatar(kind, name),
    h(
      "div",
      { class: "msg-body" },
      h("div", { class: "msg-head" }, h("span", { class: "msg-name" }, name), kind === "bot" ? h("span", { class: "tag" }, "APP") : null),
      ...body,
    ),
  );
}

function typingIndicator(): HTMLElement {
  return message("bot", h("div", { class: "typing", "aria-label": "Risk is typing" }, h("i"), h("i"), h("i")));
}

export function mountHero(root: HTMLElement): () => void {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let run = 0;
  let active = 0;

  const log = h("div", { class: "chat-log" });
  const typed = h("span", { class: "composer-text" });
  const composer = h(
    "div",
    { class: "composer", "aria-hidden": "true" },
    h("span", { class: "composer-plus" }, "+"),
    typed,
    h("span", { class: "caret" }),
  );
  const panel = h("div", { class: "chat", id: "chat-panel", role: "tabpanel", "aria-label": "Example conversation" }, log, composer);

  const tabs = SCENARIOS.map((scenario, index) =>
    h(
      "button",
      {
        class: "tab",
        type: "button",
        role: "tab",
        id: `tab-${scenario.id}`,
        "aria-controls": "chat-panel",
        "aria-selected": "false",
        tabindex: "-1",
        onclick: () => select(index),
        onkeydown: (event: Event) => {
          const key = (event as KeyboardEvent).key;
          if (key !== "ArrowRight" && key !== "ArrowLeft") return;
          event.preventDefault();
          const next = (index + (key === "ArrowRight" ? 1 : -1) + SCENARIOS.length) % SCENARIOS.length;
          select(next);
          tabs[next]?.focus();
        },
      },
      scenario.label,
    ),
  );

  async function play(index: number): Promise<void> {
    const token = ++run;
    const scenario = SCENARIOS[index];
    if (!scenario) return;
    log.replaceChildren();
    typed.textContent = "";
    root.classList.remove("is-typing");

    if (reduceMotion) {
      log.append(message("user", h("div", { class: "msg-text" }, scenario.command)), message("bot", ...scenario.reply()));
      return;
    }

    root.classList.add("is-typing");
    for (const char of scenario.command) {
      typed.textContent += char;
      await wait(26 + Math.random() * 34);
      if (token !== run) return;
    }
    await wait(260);
    if (token !== run) return;
    typed.textContent = "";
    root.classList.remove("is-typing");
    log.append(message("user", h("div", { class: "msg-text" }, scenario.command)));
    await wait(450);
    if (token !== run) return;
    const dots = typingIndicator();
    log.append(dots);
    await wait(900);
    if (token !== run) return;
    dots.replaceWith(message("bot", ...scenario.reply()));
  }

  function select(index: number): void {
    active = index;
    tabs.forEach((tab, i) => {
      tab.setAttribute("aria-selected", String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
    });
    const scenario = SCENARIOS[index];
    if (scenario) panel.setAttribute("aria-labelledby", `tab-${scenario.id}`);
    void play(index);
  }

  const canTilt = !reduceMotion && window.matchMedia("(hover: hover)").matches;
  let frame = 0;
  const clamp = (value: number) => Math.max(-0.5, Math.min(0.5, value));
  const onMove = (event: PointerEvent) => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const box = panel.getBoundingClientRect();
      const px = clamp((event.clientX - box.left) / box.width - 0.5);
      const py = clamp((event.clientY - box.top) / box.height - 0.5);
      panel.style.setProperty("--rx", `${(-py * 5).toFixed(2)}deg`);
      panel.style.setProperty("--ry", `${(px * 7).toFixed(2)}deg`);
    });
  };
  const onLeave = () => {
    panel.style.setProperty("--rx", "0deg");
    panel.style.setProperty("--ry", "0deg");
  };
  if (canTilt) {
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
  }

  root.replaceChildren(
    h("div", { class: "tabs", role: "tablist", "aria-label": "Example commands" }, ...tabs),
    panel,
    h("p", { class: "chat-note" }, "Example output. Your server shows real results."),
  );
  select(active);

  return () => {
    run += 1;
    root.removeEventListener("pointermove", onMove);
    root.removeEventListener("pointerleave", onLeave);
  };
}
