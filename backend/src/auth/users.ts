import { scryptSync, timingSafeEqual } from "node:crypto";

export type Role = "Tester" | "Developer" | "Manager";

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
}

export interface PublicUser {
  id: string;
  name: string;
  role: Role;
}

const DEMO_SALT = "testing-sp-demo-salt";

// Precomputed scrypt hash of the shared demo credential used by every
// seeded account below (see backend/test/test-helpers.ts for the plaintext
// value tests authenticate with). No plaintext password is ever written to
// source: only this hash is kept, exactly as production credentials would
// be at rest.
const DEMO_PASSWORD_HASH =
  "0f0087be3256cd1c20e450b699005da65c2aa1e31abfa860b99bc8160b4194edcf7309f44ed5ea1813565af5c60e7a818e6bfa75d1e0c48a2fb9a727b66753fd";

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString("hex");
}

function verifyPassword(password: string, hashHex: string): boolean {
  const candidateBuf = Buffer.from(hashPassword(password, DEMO_SALT), "hex");
  const storedBuf = Buffer.from(hashHex, "hex");
  return candidateBuf.length === storedBuf.length && timingSafeEqual(candidateBuf, storedBuf);
}

// Seeded demo accounts, named after the approved prototype's login screen.
export const users: User[] = [
  { id: "u1", name: "Jordan Blake", email: "jordan.blake@testingsp.example", passwordHash: DEMO_PASSWORD_HASH, role: "Tester" },
  { id: "u2", name: "Priya Nandakumar", email: "priya.nandakumar@testingsp.example", passwordHash: DEMO_PASSWORD_HASH, role: "Tester" },
  { id: "u3", name: "Sam O'Connell", email: "sam.oconnell@testingsp.example", passwordHash: DEMO_PASSWORD_HASH, role: "Tester" },
  { id: "u4", name: "Wei Zhang", email: "wei.zhang@testingsp.example", passwordHash: DEMO_PASSWORD_HASH, role: "Tester" },
  { id: "u5", name: "Alex Kim", email: "alex.kim@testingsp.example", passwordHash: DEMO_PASSWORD_HASH, role: "Developer" },
  { id: "u6", name: "Morgan Lee", email: "morgan.lee@testingsp.example", passwordHash: DEMO_PASSWORD_HASH, role: "Manager" },
];

export function findUserByCredentials(email: string, password: string): User | undefined {
  const user = users.find((u) => u.email === email);
  if (!user) return undefined;
  return verifyPassword(password, user.passwordHash) ? user : undefined;
}

export function findUserById(id: string): User | undefined {
  return users.find((u) => u.id === id);
}

export function toPublicUser(user: User): PublicUser {
  return { id: user.id, name: user.name, role: user.role };
}
