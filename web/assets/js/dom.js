export function append(parent, children) {
    for (const child of children) {
        if (child === null || child === undefined || child === false)
            continue;
        parent.appendChild(typeof child === "object" ? child : document.createTextNode(String(child)));
    }
}
export function h(tag, attrs = {}, ...children) {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
        if (value === null || value === undefined || value === false)
            continue;
        if (key === "class")
            el.className = String(value);
        else if (key.startsWith("on") && typeof value === "function")
            el.addEventListener(key.slice(2).toLowerCase(), value);
        else if (value === true)
            el.setAttribute(key, "");
        else
            el.setAttribute(key, String(value));
    }
    append(el, children);
    return el;
}
export function mount(parent, ...children) {
    parent.replaceChildren();
    append(parent, children);
}
