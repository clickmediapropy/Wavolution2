/**
 * Returns password strength 0-4.
 * 0 = empty, 1 = <6 chars, 2 = 6+ chars,
 * 3 = 6+ with mixed case or numbers,
 * 4 = 8+ with mixed case AND numbers AND special
 */
export function getPasswordStrength(password: string): number {
  if (!password) return 0;
  if (password.length < 6) return 1;

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (password.length >= 8 && hasUpper && hasLower && hasNumber && hasSpecial)
    return 4;
  if ((hasUpper && hasLower) || hasNumber) return 3;
  return 2;
}

export const STRENGTH_COLORS = [
  "bg-zinc-700", // 0: empty
  "bg-red-500", // 1: weak
  "bg-amber-500", // 2: fair
  "bg-emerald-400", // 3: good
  "bg-emerald-500", // 4: strong
] as const;
