const badAttrs = new Set([
  "bis_register",
  "cz-shortcut-listen",
  "data-new-gr-c-s-check-loaded",
  "data-gr-ext-installed",
  "data-clean-paper"
]);

function isBadAttr(name: string) {
  return (
    name.startsWith("bis_") ||
    name.startsWith("__processed_") ||
    name.startsWith("cz-") ||
    name.startsWith("data-new-gr-") ||
    name.startsWith("data-gr-") ||
    badAttrs.has(name)
  );
}

function cleanElement(element: Node | null) {
  if (!element || element.nodeType !== Node.ELEMENT_NODE) {
    return;
  }

  const attrs = (element as Element).attributes;
  for (let i = attrs.length - 1; i >= 0; i -= 1) {
    const name = attrs[i].name;
    if (isBadAttr(name)) {
      (element as Element).removeAttribute(name);
    }
  }
}

function cleanTree(root: Node | null) {
  cleanElement(root);
  if (!(root instanceof Element || root instanceof Document)) {
    return;
  }

  root.querySelectorAll("*").forEach(cleanElement);
}

try {
  cleanTree(document.documentElement);

  const observer = new MutationObserver((records) => {
    records.forEach((record) => {
      if (record.type === "attributes") {
        cleanElement(record.target);
      }

      record.addedNodes.forEach(cleanTree);
    });
  });

  observer.observe(document.documentElement, {
    attributes: true,
    childList: true,
    subtree: true
  });

  window.addEventListener("load", () => {
    cleanTree(document.documentElement);
    window.setTimeout(() => observer.disconnect(), 2000);
  });
} catch {
  // Extension cleanup is best-effort and must never block app bootstrap.
}
