/**
 * Client-side SHA-256 password hashing helper so plaintext passwords are never persisted to Firestore.
 */
export async function hashPassword(password: string): Promise<string> {
  const normalized = password.trim();
  if (typeof crypto !== 'undefined' && crypto.subtle && typeof TextEncoder !== 'undefined') {
    const data = new TextEncoder().encode(`bd_telecom_salt_v1:${normalized}`);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback deterministic hash for environments lacking subtle crypto
  let h1 = 0xdeadbeef ^ normalized.length;
  let h2 = 0x41c6ce57 ^ normalized.length;
  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `${(h2 >>> 0).toString(16).padStart(8, '0')}${(h1 >>> 0).toString(16).padStart(8, '0')}fb`;
}

export async function verifyUserPassword(
  inputPassword: string,
  user: { password?: string; passwordHash?: string }
): Promise<boolean> {
  const clean = inputPassword.trim();
  if (user.passwordHash) {
    const candidateHash = await hashPassword(clean);
    if (candidateHash === user.passwordHash) return true;
  }
  if (user.password) {
    return user.password === clean;
  }
  return !user.passwordHash && !user.password;
}
