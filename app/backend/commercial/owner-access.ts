import { backendDatabase } from "../core/database";
import { listUsers } from "../core/local-auth-store";
import { isInternalOwnerEmail } from "./owner-access-config";

export async function hasInternalOwnerAccess(userId: string): Promise<boolean> {
  if (!userId || userId === "admin-session") {
    return false;
  }

  if (!backendDatabase.enabled) {
    const users = await listUsers();
    const user = users.find((item) => item.id === userId);
    return user?.userType === "FOUNDER" || isInternalOwnerEmail(user?.email);
  }

  const { rows } = await backendDatabase.query<{ email: string; user_type?: string }>(
    `
    SELECT email, user_type
    FROM users
    WHERE id = $1
    LIMIT 1
    `,
    [userId]
  );

  const row = rows[0];
  if (row?.user_type === "FOUNDER") {
    return true;
  }

  return isInternalOwnerEmail(row?.email);
}
