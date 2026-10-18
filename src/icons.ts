const NS = "http://www.w3.org/2000/svg";

export type IconName = "ticket" | "logs" | "welcome" | "ai" | "lookup" | "shield";

const PATHS: Record<IconName, string[]> = {
  ticket: ["M4 6h16v3.5a2.5 2.5 0 0 0 0 5V18H4v-3.5a2.5 2.5 0 0 0 0-5z", "M9.5 9v6"],
  logs: ["M5 6h14", "M5 12h14", "M5 18h9"],
  welcome: ["M4 5h16v11h-9l-4.5 3.5V16H4z", "M8.5 10.5h.01", "M12 10.5h.01", "M15.5 10.5h.01"],
  ai: ["M11 3l1.8 5.2L18 10l-5.2 1.8L11 17l-1.8-5.2L4 10l5.2-1.8z", "M18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8z"],
  lookup: ["M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z", "M16.2 16.2L21 21"],
  shield: ["M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z", "M9 12l2 2 4-4"],
};

export function icon(name: IconName): SVGSVGElement {
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("class", "icon");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  for (const d of PATHS[name]) {
    const path = document.createElementNS(NS, "path");
    path.setAttribute("d", d);
    path.setAttribute("pathLength", "1");
    svg.appendChild(path);
  }
  return svg;
}
