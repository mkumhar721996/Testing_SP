export type Role = "Tester" | "Developer" | "Manager";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
}

export interface PublicUser {
  id: string;
  name: string;
  role: Role;
}

// Seeded demo accounts, named after the approved prototype's login screen.
// Password is an obviously-fake shared demo credential, not a real secret.
export const users: User[] = [
  { id: "u1", name: "Jordan Blake", email: "jordan.blake@testingsp.example", password: "test-password", role: "Tester" },
  { id: "u2", name: "Priya Nandakumar", email: "priya.nandakumar@testingsp.example", password: "test-password", role: "Tester" },
  { id: "u3", name: "Sam O'Connell", email: "sam.oconnell@testingsp.example", password: "test-password", role: "Tester" },
  { id: "u4", name: "Wei Zhang", email: "wei.zhang@testingsp.example", password: "test-password", role: "Tester" },
  { id: "u5", name: "Alex Kim", email: "alex.kim@testingsp.example", password: "test-password", role: "Developer" },
  { id: "u6", name: "Morgan Lee", email: "morgan.lee@testingsp.example", password: "test-password", role: "Manager" },
];

export function findUserByCredentials(email: string, password: string): User | undefined {
  return users.find((u) => u.email === email && u.password === password);
}

export function findUserById(id: string): User | undefined {
  return users.find((u) => u.id === id);
}

export function toPublicUser(user: User): PublicUser {
  return { id: user.id, name: user.name, role: user.role };
}
