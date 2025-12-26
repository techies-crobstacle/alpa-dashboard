// utils/jwt.ts
// Simple JWT decode utility (no validation, just base64 decode)
export function decodeJWT(token: string): any {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (e) {
    return null;
  }
}
