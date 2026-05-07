import bcrypt from "bcryptjs";

export async function verifyPassword(password: string, storedHash: string) {
  if (!(storedHash.startsWith("$2a$") || storedHash.startsWith("$2b$") || storedHash.startsWith("$2y$"))) {
    return false;
  }
  return bcrypt.compare(password, storedHash);
}
