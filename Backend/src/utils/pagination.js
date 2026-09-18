/**
 * Cursor Pagination Utility
 * Provides safe, URL-safe Base64 cursor encoding and decoding.
 */

const encodeCursor = (data) => {
  if (!data) return null;
  try {
    const jsonString = JSON.stringify(data);
    return Buffer.from(jsonString, "utf8").toString("base64url");
  } catch {
    return null;
  }
};

const decodeCursor = (cursorString) => {
  if (!cursorString || typeof cursorString !== "string") return null;
  try {
    const jsonString = Buffer.from(cursorString, "base64url").toString("utf8");
    const parsed = JSON.parse(jsonString);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

module.exports = {
  encodeCursor,
  decodeCursor,
};
