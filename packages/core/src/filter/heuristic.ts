// Shannon entropy analysis to detect random/dynamic strings.

/**
 * Calculate Shannon entropy of a string.
 * Returns bits of entropy: -Σ(p * log2(p))
 */
export function shannonEntropy(str: string): number {
  if (str.length === 0) return 0;

  const freq = new Map<string, number>();
  for (const ch of str) {
    freq.set(ch, (freq.get(ch) ?? 0) + 1);
  }

  let entropy = 0;
  const len = str.length;
  for (const count of freq.values()) {
    const p = count / len;
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  }

  return entropy;
}

// Matches separator followed by 5+ hex chars that include at least one a-f letter
const RANDOM_SUFFIX_RE = /[_-](?=[a-f0-9]{5,}$)(?=.*[a-f])/i;

/**
 * Check if a string looks like natural word segments (not random).
 * Matches: "hnmain", "page-top", "user_card", "myComponent", "data-testid", "__next"
 * Also matches purely numeric IDs: "47840219", "123456"
 * And prefixed numeric IDs: "score_47840219", "item_123"
 * Does NOT match hex hash segments: "deadbeef", "a3f8b2"
 */
function looksLikeWords(value: string): boolean {
  // Split by common separators
  const segments = value.split(/[-_]+/).filter(Boolean);
  return segments.every(seg => {
    // Purely numeric segments are OK (database IDs, etc.)
    if (/^[0-9]+$/.test(seg)) return true;
    // Alphabetic segments must NOT look like hex hashes:
    // A hex hash is lowercase-only and uses only chars a-f.
    // Real words typically have chars outside a-f (g-z) or mixed case.
    if (/^[a-zA-Z]+$/.test(seg)) {
      // If it's all lowercase and only uses a-f, it could be hex
      if (/^[a-f]+$/.test(seg) && seg.length >= 4) return false;
      return true;
    }
    return false;
  });
}

/**
 * Check if a string has the hallmarks of a generated/random value:
 * mixed case + digits in non-standard patterns, or uppercase fragments
 * that don't follow camelCase conventions.
 */
function hasRandomCharMix(value: string): boolean {
  // Contains digits mixed with letters (not just a trailing number like "item2")
  const hasInterspersedDigits = /[a-zA-Z][0-9]+[a-zA-Z]/.test(value);
  // Has uppercase letters in unusual positions (not camelCase start)
  const hasRandomUppercase = /[a-z][A-Z]{2,}/.test(value) || /^[A-Z][a-z]+[A-Z]{2,}/.test(value);
  return hasInterspersedDigits || hasRandomUppercase;
}

/**
 * Determine if a value is likely dynamic/generated.
 *
 * Returns true if:
 * 1. Has a random hex suffix after a separator (must contain a-f letters), OR
 * 2. Has random character mixing AND high entropy, OR
 * 3. Very high normalized entropy on non-word-like strings
 */
export function isLikelyDynamic(value: string, threshold: number): boolean {
  if (value.length === 0) return false;

  // Word-like values are almost certainly not dynamic
  if (looksLikeWords(value)) return false;

  // Condition 1: random hex suffix after separator (requires actual a-f chars)
  if (RANDOM_SUFFIX_RE.test(value)) {
    return true;
  }

  const entropy = shannonEntropy(value);
  const normalizedEntropy = entropy / Math.log2(Math.max(value.length, 2));

  // Condition 2: random char mixing with elevated entropy
  if (hasRandomCharMix(value) && normalizedEntropy > threshold * 0.8) {
    return true;
  }

  // Condition 3: very high normalized entropy on non-trivial strings
  if (normalizedEntropy > threshold + 0.15 && value.length >= 6) {
    return true;
  }

  return false;
}
