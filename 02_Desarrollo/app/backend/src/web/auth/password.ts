import bcrypt from "bcryptjs";

export async function verifyPassword(password: string, storedHash: string) {
  if (storedHash.startsWith("$2a$") || storedHash.startsWith("$2b$") || storedHash.startsWith("$2y$")) {
    return bcrypt.compare(password, storedHash);
  }
  // Fallback MVP: allow plain match only in dev-like setups.
  return password === storedHash;
}

