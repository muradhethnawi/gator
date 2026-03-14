import { db } from "..";
import { users } from "../schema";
import { eq, desc } from "drizzle-orm";

export async function createUser(name: string) {
  const [result] = await db.insert(users).values({ name }).returning();
  return result;
}

export async function getUserByName(name: string) {
  const result = await db.select().from(users).where(eq(users.name, name));
  return result[0] ?? null;
}

export async function deleteAllUsers() {
  await db.delete(users).execute();
}

export async function getUsers() {
  return await db.select().from(users);
}

export async function getCurrentUser() {
  const result = await db
    .select()
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(1);
  if (!result[0]) {
    console.error("No user found. Please register first.");
    process.exit(1);
  }
  return result[0];
}

export async function resetDB() {
  await db.delete(users).execute();
}
