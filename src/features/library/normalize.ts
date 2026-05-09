const ligatures = new Map([
  ["\ufb00", "ff"],
  ["\ufb01", "fi"],
  ["\ufb02", "fl"],
  ["\ufb03", "ffi"],
  ["\ufb04", "ffl"]
]);

export function normalizeResearchText(text: string) {
  let normalized = text;
  for (const [from, to] of ligatures) normalized = normalized.replaceAll(from, to);

  return normalized
    .replace(/^\uFEFF+/, "")
    .replace(/^ÿ+/, "")
    .replace(/\uFFFD+/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/\u00ad/g, "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function normalizeTitleText(text: string) {
  let title = normalizeResearchText(text)
    .replace(/^ÿ+/, "")
    .replace(/[∗†‡§¶]+/g, "")
    .replace(/\s+/g, " ")
    .trim();

  for (let index = 0; index < 4; index += 1) {
    title = title.replace(/\b([A-Z])\s+([A-Z][A-Z]+)\b/g, "$1$2");
    title = title.replace(/\b((?:[A-Z]\s+){2,}[A-Z])\b/g, (match) => match.replace(/\s+/g, ""));
  }

  title = title
    .replace(/\bANIMAGE\b/g, "AN IMAGE")
    .replace(/\b16 X 16\b/g, "16x16")
    .replace(/\s+:\s+/g, ": ")
    .replace(/\s+/g, " ")
    .trim();

  if (title === title.toUpperCase() && /[A-Z]{3}/.test(title)) {
    return title
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase())
      .replace(/\bIs\b/g, "is")
      .replace(/\bFor\b/g, "for")
      .replace(/\bAt\b/g, "at");
  }

  return title;
}

export async function decodeTextBuffer(buffer: ArrayBuffer) {
  const attempts = ["utf-8", "windows-1252", "iso-8859-1"];
  const decoded = attempts.map((encoding) => {
    const value = new TextDecoder(encoding, { fatal: false }).decode(buffer);
    return { encoding, value, replacementCount: replacementCount(value) };
  });

  const best = decoded.sort((a, b) => a.replacementCount - b.replacementCount)[0];
  return {
    encoding: best.encoding,
    text: normalizeResearchText(best.value)
  };
}

export function replacementCount(text: string) {
  return (text.match(/\uFFFD/g) ?? []).length;
}
