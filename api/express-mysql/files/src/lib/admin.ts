import type { Role } from '@prisma/client';
import prisma from './prisma.js';

/**
 * Set the role of an existing account, by email (trimmed and lowercased like the API
 * does). Returns the updated user, or null when no account has that email.
 * Used by src/scripts/set-role.ts to make the first admin.
 */
export async function setUserRole(email: string, role: Role) {
  const normalized = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalized }, select: { id: true } });
  if (!user) return null;
  return prisma.user.update({
    where: { id: user.id },
    data: { role },
    select: { id: true, email: true, role: true },
  });
}
