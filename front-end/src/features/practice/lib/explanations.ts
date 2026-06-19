const HTML_PATTERN = /<\/?[a-z][\s\S]*>/i;
const HTML_ENTITY_PATTERN = /&(?:nbsp|amp|lt|gt|quot|apos|#\d+|#[xX][0-9a-f]+);/;

function decodeHtmlEntities(value: string): string {
  return value.replace(/&(?:nbsp|amp|lt|gt|quot|apos|#\d+|#[xX][0-9a-f]+);/g, (entity) => {
    switch (entity) {
      case "&nbsp;":
        return " ";
      case "&amp;":
        return "&";
      case "&lt;":
        return "<";
      case "&gt;":
        return ">";
      case "&quot;":
        return '"';
      case "&apos;":
        return "'";
      default: {
        const decimal = entity.match(/^&#(\d+);$/);
        if (decimal) {
          return String.fromCodePoint(Number(decimal[1]));
        }

        const hex = entity.match(/^&#[xX]([0-9a-f]+);$/i);
        if (hex) {
          return String.fromCodePoint(Number.parseInt(hex[1], 16));
        }

        return entity;
      }
    }
  });
}

function htmlToPlainInline(value: string): string {
  return decodeHtmlEntities(
    value
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function cleanupExplanationLines(value: string): string {
  return value
    .split("\n")
    .map((line) =>
      line
        .replace(/(\*\*[^*]+\*\*|\*[^*]+\*)(?=[A-Za-zÀ-ỹ0-9])/g, "$1 ")
        .replace(/[ \t]+/g, " ")
        .trim(),
    )
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function normalizeExplanationForDisplay(value: string): string {
  if (!value) return "";

  const hasHtmlLikeContent = HTML_PATTERN.test(value) || HTML_ENTITY_PATTERN.test(value);
  if (!hasHtmlLikeContent) {
    return value;
  }

  const decoded = decodeHtmlEntities(value);
  const withoutUnsafeBlocks = decoded.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, "");
  const withInlineMarkdown = withoutUnsafeBlocks
    .replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_match, _tag, content: string) => {
      const plain = htmlToPlainInline(content);
      return plain ? `**${plain}**` : "";
    })
    .replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_match, _tag, content: string) => {
      const plain = htmlToPlainInline(content);
      return plain ? `*${plain}*` : "";
    });

  const withLineBreaks = withInlineMarkdown
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|section|article|li|ul|ol|h[1-6])>/gi, "\n")
    .replace(/<(li)\b[^>]*>/gi, "\n- ")
    .replace(/<(p|div|section|article|ul|ol|h[1-6])\b[^>]*>/gi, "\n");

  return cleanupExplanationLines(
    decodeHtmlEntities(withLineBreaks.replace(/<[^>]+>/g, "")),
  );
}
