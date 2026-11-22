/**
 * Make an existing account an admin (or demote it back to a normal user).
 *
 *   npm run set-role -- ada@example.com            # admin
 *   npm run set-role -- ada@example.com user       # back to a normal user
 *
 * In the production image (no tsx): node dist/scripts/set-role.js ada@example.com
 * Register the account through POST /api/v1/auth/register first.
 */
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

import prisma from '../lib/prisma.js';
import { setUserRole } from '../lib/admin.js';

async function main(): Promise<number> {
  const [email, role = 'admin'] = process.argv.slice(2);
  if (!email || (role !== 'admin' && role !== 'user')) {
    console.error('Usage: set-role <email> [admin|user]   (default: admin)');
    return 2;
  }
  const user = await setUserRole(email, role);
  if (!user) {
    console.error(`No account with email ${email.trim().toLowerCase()}. Register it first.`);
    return 1;
  }
  console.log(`${user.email} (${user.id}) is now "${user.role}".`);
  return 0;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
