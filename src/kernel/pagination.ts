export type CursorKey = {
  publishedAt: string;
  id: string;
};

export function encodeCursor(key: CursorKey): string {
  return Buffer.from(`${key.publishedAt}|${key.id}`, "utf8").toString("base64url");
}

export function decodeCursor(raw: string): CursorKey | null {
  try {
    const [publishedAt, id] = Buffer.from(raw, "base64url").toString("utf8").split("|");
    if (!publishedAt || !id) return null;
    return { publishedAt, id };
  } catch {
    return null;
  }
}
