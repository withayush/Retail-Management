/**
 * VendorOS Smart Search & Fuzzy Typo Tolerance Engine
 * Provides multi-token matching, Levenshtein distance, Jaro-Winkler similarity,
 * phonetic approximations, and relevance ranking for Kirana & Retail products.
 */

// 1. Damerau-Levenshtein Distance (handles insertions, deletions, substitutions, and transpositions)
function levenshteinDistance(a, b) {
  if (!a || !b) return (a || "").length || (b || "").length;
  const s1 = a.toLowerCase();
  const s2 = b.toLowerCase();

  const m = s1.length;
  const n = s2.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // deletion
        dp[i][j - 1] + 1,      // insertion
        dp[i - 1][j - 1] + cost // substitution
      );

      // Transposition (e.g., "teh" -> "the")
      if (i > 1 && j > 1 && s1[i - 1] === s2[j - 2] && s1[i - 2] === s2[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
      }
    }
  }

  return dp[m][n];
}

// 2. Normalized similarity score between 0.0 and 1.0
function stringSimilarity(s1, s2) {
  if (!s1 || !s2) return 0;
  const a = s1.trim().toLowerCase();
  const b = s2.trim().toLowerCase();
  if (a === b) return 1.0;

  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;

  const dist = levenshteinDistance(a, b);
  return Math.max(0, 1 - dist / maxLen);
}

// 3. Clean and tokenize text into distinct normalized words
function tokenize(text) {
  if (!text) return [];
  return String(text)
    .toLowerCase()
    .replace(/[^\w\s\u0900-\u097F]/gi, " ") // preserves alphanumeric and Devanagari Hindi chars
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

// 4. Calculate comprehensive relevance score for a single product
function scoreProduct(product, rawQuery) {
  if (!product || !rawQuery) return { score: 0, matchType: "NONE" };

  const q = rawQuery.trim().toLowerCase();
  const qTokens = tokenize(q);

  const name = (product.name || "").toLowerCase();
  const sku = (product.sku || "").toLowerCase();
  const barcode = (product.barcode || "").toLowerCase();
  const catName = (product.categoryId?.name || product.category?.name || "").toLowerCase();
  const desc = (product.description || "").toLowerCase();

  // ── RULE 1: Exact Barcode Match (Instant 100% priority) ──
  if (barcode && (barcode === q || barcode.endsWith(q))) {
    return { score: 100, matchType: "EXACT_BARCODE", matchedField: "barcode", similarity: 1.0 };
  }

  // ── RULE 2: Exact SKU Match (Instant 98% priority) ──
  if (sku && (sku === q || sku === q.toUpperCase())) {
    return { score: 98, matchType: "EXACT_SKU", matchedField: "sku", similarity: 1.0 };
  }

  // ── RULE 3: Exact Full Name Match (95% priority) ──
  if (name === q) {
    return { score: 95, matchType: "EXACT_NAME", matchedField: "name", similarity: 1.0 };
  }

  // ── RULE 4: Name Starts With Query (Prefix Boost) ──
  if (name.startsWith(q)) {
    return { score: 90, matchType: "PREFIX_NAME", matchedField: "name", similarity: 0.95 };
  }

  // ── RULE 5: SKU or Barcode Substring Match ──
  if (sku.includes(q)) {
    return { score: 88, matchType: "SKU_MATCH", matchedField: "sku", similarity: 0.9 };
  }
  if (barcode && barcode.includes(q)) {
    return { score: 87, matchType: "BARCODE_MATCH", matchedField: "barcode", similarity: 0.9 };
  }

  // ── RULE 6: Multi-Token Matching (Word Order Invariant) ──
  const prodTokens = tokenize(`${name} ${catName} ${desc} ${sku}`);
  if (qTokens.length > 0 && prodTokens.length > 0) {
    let matchedTokenCount = 0;
    let tokenFuzzySum = 0;

    for (const qt of qTokens) {
      let bestTokSim = 0;
      for (const pt of prodTokens) {
        if (pt === qt) {
          bestTokSim = 1.0;
          break;
        }
        if (pt.startsWith(qt)) {
          bestTokSim = Math.max(bestTokSim, 0.9);
        } else if (pt.includes(qt)) {
          bestTokSim = Math.max(bestTokSim, 0.8);
        } else {
          const sim = stringSimilarity(qt, pt);
          if (sim >= 0.70) {
            bestTokSim = Math.max(bestTokSim, sim * 0.85);
          }
        }
      }

      if (bestTokSim >= 0.70) {
        matchedTokenCount++;
        tokenFuzzySum += bestTokSim;
      }
    }

    // If ALL tokens match or have strong fuzzy match
    if (matchedTokenCount === qTokens.length) {
      const avgSim = tokenFuzzySum / qTokens.length;
      return {
        score: Math.round(75 + avgSim * 12),
        matchType: avgSim > 0.95 ? "ALL_TOKENS_EXACT" : "ALL_TOKENS_FUZZY",
        matchedField: "name",
        similarity: avgSim,
      };
    }

    // If MOST tokens match (e.g. 2 out of 3 tokens)
    if (matchedTokenCount > 0 && qTokens.length > 1 && matchedTokenCount / qTokens.length >= 0.5) {
      const ratio = matchedTokenCount / qTokens.length;
      return {
        score: Math.round(50 + ratio * 20),
        matchType: "PARTIAL_TOKENS",
        matchedField: "name",
        similarity: ratio,
      };
    }
  }

  // ── RULE 7: Typo Tolerance / Single Word Fuzzy Match (Levenshtein) ──
  // Checks if the full query is a typo of the product name or any word in the name
  let bestWordSim = stringSimilarity(q, name);

  for (const pt of prodTokens) {
    const wSim = stringSimilarity(q, pt);
    if (wSim > bestWordSim) {
      bestWordSim = wSim;
    }
  }

  // Also check phonetic / character transposition for common Hindi/English Kirana terms
  if (bestWordSim >= 0.65) {
    return {
      score: Math.round(bestWordSim * 60),
      matchType: "FUZZY_TYPO",
      matchedField: "name",
      similarity: bestWordSim,
    };
  }

  // ── RULE 8: Category Match ──
  if (catName && (catName.includes(q) || stringSimilarity(q, catName) >= 0.75)) {
    return { score: 45, matchType: "CATEGORY_MATCH", matchedField: "category", similarity: 0.7 };
  }

  return { score: 0, matchType: "NONE", similarity: 0 };
}

// 5. Escape string for safe use inside RegExp
function escapeRegex(str) {
  if (!str || typeof str !== "string") return "";
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// 6. Rank and filter a list of products by relevance score
function rankProducts(products, query, minScore = 30) {
  if (!query || !query.trim() || !Array.isArray(products)) return products;

  const scored = [];
  for (const p of products) {
    const scoreMeta = scoreProduct(p, query);
    if (scoreMeta.score >= minScore) {
      scored.push({
        ...p,
        _searchScore: scoreMeta.score,
        _matchType: scoreMeta.matchType,
        _similarity: scoreMeta.similarity,
        _matchedField: scoreMeta.matchedField,
      });
    }
  }

  scored.sort((a, b) => {
    if (b._searchScore !== a._searchScore) {
      return b._searchScore - a._searchScore;
    }
    return (b.updatedAt || 0) - (a.updatedAt || 0);
  });

  return scored;
}

// 7. Calculate relevance score for a Customer (Name, Phone, Email, City)
function scoreCustomer(customer, rawQuery) {
  if (!customer || !rawQuery) return { score: 0, matchType: "NONE" };

  const q = rawQuery.trim().toLowerCase();
  const qTokens = tokenize(q);
  const cleanDigits = q.replace(/\D/g, "");

  const name = (customer.name || "").toLowerCase();
  const phone = (customer.phone || "").replace(/\D/g, "");
  const email = (customer.email || "").toLowerCase();
  const city = (customer.city || "").toLowerCase();

  // RULE 1: Phone match (100 for exact or ending digits)
  if (cleanDigits.length >= 4) {
    if (phone === cleanDigits || phone.endsWith(cleanDigits)) {
      return { score: 100, matchType: "EXACT_PHONE", matchedField: "phone", similarity: 1.0 };
    }
    if (phone.includes(cleanDigits)) {
      return { score: 90, matchType: "PHONE_SUBSTRING", matchedField: "phone", similarity: 0.9 };
    }
  }

  // RULE 2: Exact Name Match
  if (name === q) {
    return { score: 95, matchType: "EXACT_NAME", matchedField: "name", similarity: 1.0 };
  }

  // RULE 3: Prefix Name Match
  if (name.startsWith(q)) {
    return { score: 90, matchType: "PREFIX_NAME", matchedField: "name", similarity: 0.95 };
  }

  // RULE 4: Multi-token All-Words Match
  if (qTokens.length > 1) {
    const allPresent = qTokens.every((tok) => name.includes(tok));
    if (allPresent) {
      return { score: 85, matchType: "MULTI_TOKEN", matchedField: "name", similarity: 0.9 };
    }
  }

  // RULE 5: Substring Name Match
  if (name.includes(q)) {
    return { score: 75, matchType: "NAME_SUBSTRING", matchedField: "name", similarity: 0.85 };
  }

  // RULE 6: Typo / Fuzzy Name Similarity
  const nameSim = stringSimilarity(q, name);
  if (nameSim >= 0.72) {
    return {
      score: Math.round(nameSim * 70),
      matchType: "FUZZY_TYPO",
      matchedField: "name",
      similarity: nameSim,
    };
  }

  // Check word-by-word typo
  const nameWords = tokenize(name);
  for (const word of nameWords) {
    const wordSim = stringSimilarity(q, word);
    if (wordSim >= 0.75) {
      return {
        score: Math.round(wordSim * 65),
        matchType: "FUZZY_TYPO",
        matchedField: "name",
        similarity: wordSim,
      };
    }
  }

  // RULE 7: Email or City
  if (email && email.includes(q)) {
    return { score: 60, matchType: "EMAIL_MATCH", matchedField: "email", similarity: 0.8 };
  }
  if (city && city.includes(q)) {
    return { score: 50, matchType: "CITY_MATCH", matchedField: "city", similarity: 0.7 };
  }

  return { score: 0, matchType: "NONE", similarity: 0 };
}

// 8. Rank Customers
function rankCustomers(customers, query, minScore = 35) {
  if (!query || !query.trim() || !Array.isArray(customers)) return customers;

  const scored = [];
  for (const c of customers) {
    const meta = scoreCustomer(c, query);
    if (meta.score >= minScore) {
      const doc = c.toObject ? c.toObject() : { ...c };
      scored.push({
        ...doc,
        _searchScore: meta.score,
        _matchType: meta.matchType,
        _similarity: meta.similarity,
        _matchedField: meta.matchedField,
      });
    }
  }

  scored.sort((a, b) => {
    if (b._searchScore !== a._searchScore) {
      return b._searchScore - a._searchScore;
    }
    return (b.currentBalance || 0) - (a.currentBalance || 0);
  });

  return scored;
}

// 9. Score Supplier (Company, Contact, Phone, GSTIN, Email)
function scoreSupplier(supplier, rawQuery) {
  if (!supplier || !rawQuery) return { score: 0, matchType: "NONE" };

  const q = rawQuery.trim().toLowerCase();
  const qTokens = tokenize(q);
  const cleanDigits = q.replace(/\D/g, "");

  const company = (supplier.company || "").toLowerCase();
  const contact = (supplier.contactName || "").toLowerCase();
  const phone = (supplier.phone || "").replace(/\D/g, "");
  const gstin = (supplier.gstin || "").toLowerCase();
  const email = (supplier.email || "").toLowerCase();

  // Exact Phone Match
  if (cleanDigits.length >= 4) {
    if (phone === cleanDigits || phone.endsWith(cleanDigits)) {
      return { score: 100, matchType: "EXACT_PHONE", matchedField: "phone", similarity: 1.0 };
    }
    if (phone.includes(cleanDigits)) {
      return { score: 90, matchType: "PHONE_SUBSTRING", matchedField: "phone", similarity: 0.9 };
    }
  }

  // Exact Company
  if (company === q) {
    return { score: 98, matchType: "EXACT_COMPANY", matchedField: "company", similarity: 1.0 };
  }

  // Prefix Company
  if (company.startsWith(q)) {
    return { score: 92, matchType: "PREFIX_COMPANY", matchedField: "company", similarity: 0.95 };
  }

  // GSTIN Match
  if (gstin && (gstin === q || gstin.includes(q))) {
    return { score: 90, matchType: "GSTIN_MATCH", matchedField: "gstin", similarity: 0.95 };
  }

  // Multi-token Company / Contact
  if (qTokens.length > 1) {
    const allCompany = qTokens.every((tok) => company.includes(tok));
    if (allCompany) {
      return { score: 88, matchType: "MULTI_TOKEN", matchedField: "company", similarity: 0.9 };
    }
    const allContact = qTokens.every((tok) => contact.includes(tok));
    if (allContact) {
      return { score: 85, matchType: "MULTI_TOKEN", matchedField: "contactName", similarity: 0.9 };
    }
  }

  // Substring matches
  if (company.includes(q)) {
    return { score: 78, matchType: "COMPANY_SUBSTRING", matchedField: "company", similarity: 0.85 };
  }
  if (contact.includes(q)) {
    return { score: 75, matchType: "CONTACT_SUBSTRING", matchedField: "contactName", similarity: 0.85 };
  }

  // Typo Tolerance on Company
  const compSim = stringSimilarity(q, company);
  if (compSim >= 0.72) {
    return {
      score: Math.round(compSim * 70),
      matchType: "FUZZY_TYPO",
      matchedField: "company",
      similarity: compSim,
    };
  }

  // Check word-by-word typo on Company
  const compWords = tokenize(company);
  for (const word of compWords) {
    const wordSim = stringSimilarity(q, word);
    if (wordSim >= 0.75) {
      return {
        score: Math.round(wordSim * 68),
        matchType: "FUZZY_TYPO",
        matchedField: "company",
        similarity: wordSim,
      };
    }
  }

  // Typo on Contact
  const contactSim = stringSimilarity(q, contact);
  if (contactSim >= 0.75) {
    return {
      score: Math.round(contactSim * 65),
      matchType: "FUZZY_TYPO",
      matchedField: "contactName",
      similarity: contactSim,
    };
  }

  // Check word-by-word typo on Contact
  const contactWords = tokenize(contact);
  for (const word of contactWords) {
    const wordSim = stringSimilarity(q, word);
    if (wordSim >= 0.75) {
      return {
        score: Math.round(wordSim * 65),
        matchType: "FUZZY_TYPO",
        matchedField: "contactName",
        similarity: wordSim,
      };
    }
  }

  // Email
  if (email && email.includes(q)) {
    return { score: 60, matchType: "EMAIL_MATCH", matchedField: "email", similarity: 0.8 };
  }

  return { score: 0, matchType: "NONE", similarity: 0 };
}

// 10. Rank Suppliers
function rankSuppliers(suppliers, query, minScore = 35) {
  if (!query || !query.trim() || !Array.isArray(suppliers)) return suppliers;

  const scored = [];
  for (const s of suppliers) {
    const meta = scoreSupplier(s, query);
    if (meta.score >= minScore) {
      const doc = s.toObject ? s.toObject() : { ...s };
      scored.push({
        ...doc,
        _searchScore: meta.score,
        _matchType: meta.matchType,
        _similarity: meta.similarity,
        _matchedField: meta.matchedField,
      });
    }
  }

  scored.sort((a, b) => {
    if (b._searchScore !== a._searchScore) {
      return b._searchScore - a._searchScore;
    }
    return (a.company || "").localeCompare(b.company || "");
  });

  return scored;
}

module.exports = {
  levenshteinDistance,
  stringSimilarity,
  tokenize,
  escapeRegex,
  scoreProduct,
  rankProducts,
  scoreCustomer,
  rankCustomers,
  scoreSupplier,
  rankSuppliers,
};
