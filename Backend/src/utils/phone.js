// src/utils/phone.js

const normalizePhone = (phone) => {
  if (!phone) return "";
  
  // 1. Remove all spaces, dashes, parentheses or non-digit characters except '+'
  let cleaned = phone.replace(/[\s\-\(\)]/g, "").trim();

  // 2. Remove leading zeros if any
  cleaned = cleaned.replace(/^0+/, "");

  // 3. Handle Indian formats specifically based on regex rules
  // If it starts with +91, ensure standard format
  if (cleaned.startsWith("+91")) {
    const digits = cleaned.slice(3);
    if (/^[6-9]\d{9}$/.test(digits)) {
      return `+91${digits}`;
    }
  }

  // If it starts with 91 and has 12 digits total
  if (cleaned.startsWith("91") && cleaned.length === 12) {
    const digits = cleaned.slice(2);
    if (/^[6-9]\d{9}$/.test(digits)) {
      return `+91${digits}`;
    }
  }

  // If it's a raw 10-digit number starting with 6-9
  if (/^[6-9]\d{9}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }

  // Fallback: return cleaned or let validation catch it
  return cleaned;
};

module.exports = {
  normalizePhone,
};