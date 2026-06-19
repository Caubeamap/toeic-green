export function getUserInitials(displayName: string | null | undefined) {
  const normalizedName = (displayName || "").trim();

  if (!normalizedName) {
    return "TG";
  }

  const words = normalizedName
    .split(/\s+/)
    .map((word) => Array.from(word.trim()).filter(Boolean))
    .filter((letters) => letters.length > 0);

  if (words.length >= 2) {
    return `${words[0][0]}${words[words.length - 1][0]}`.toLocaleUpperCase(
      "vi-VN",
    );
  }

  return words[0].slice(0, 2).join("").toLocaleUpperCase("vi-VN") || "TG";
}

export function normalizeAvatarUrl(value: string | null | undefined) {
  const rawValue = value?.trim();

  if (!rawValue) {
    return null;
  }

  try {
    const url = new URL(rawValue);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}
