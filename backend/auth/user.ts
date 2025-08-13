import { SQLDatabase } from "encore.dev/storage/sqldb";

export const authDB = new SQLDatabase("pharmacy", {
  migrations: "./migrations",
});

export interface User {
  id: number;
  username: string;
  password_hash: string;
  role: string;
  created_at: Date;
}

export async function getUserByUsername(username: string): Promise<User | null> {
  return await authDB.queryRow<User>`
    SELECT id, username, password_hash, role, created_at 
    FROM users 
    WHERE username = ${username}
  `;
}

export async function getUserById(id: number): Promise<User | null> {
  return await authDB.queryRow<User>`
    SELECT id, username, password_hash, role, created_at 
    FROM users 
    WHERE id = ${id}
  `;
}

export async function createUser(username: string, passwordHash: string, role: string): Promise<User> {
  const result = await authDB.queryRow<User>`
    INSERT INTO users (username, password_hash, role, created_at)
    VALUES (${username}, ${passwordHash}, ${role}, NOW())
    RETURNING id, username, password_hash, role, created_at
  `;
  
  if (!result) {
    throw new Error("Failed to create user");
  }
  
  return result;
}

export async function getAllUsers(): Promise<User[]> {
  return await authDB.queryAll<User>`
    SELECT id, username, password_hash, role, created_at 
    FROM users 
    ORDER BY created_at DESC
  `;
}

export async function updateUser(id: number, username: string, role: string): Promise<User | null> {
  return await authDB.queryRow<User>`
    UPDATE users 
    SET username = ${username}, role = ${role}
    WHERE id = ${id}
    RETURNING id, username, password_hash, role, created_at
  `;
}

export async function deleteUser(id: number): Promise<void> {
  await authDB.exec`DELETE FROM users WHERE id = ${id}`;
}
