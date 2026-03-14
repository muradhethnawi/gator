import { createUser, getCurrentUser, resetDB } from "./db/queries/users";
import { setUser, readConfig } from "../config.js";
import { getUserByName } from "./db/queries/users";

export { createUser, resetDB };

export async function getCurrentUser() {
  const config = readConfig();
  if (!config.currentUserName) {
    console.error("No user logged in. Please login first.");
    process.exit(1);
  }
  const user = await getUserByName(config.currentUserName);
  if (!user) {
    console.error(`User ${config.currentUserName} not found.`);
    process.exit(1);
  }
  return user;
}

export async function loginUser(name: string) {
  const user = await getUserByName(name);
  if (!user) {
    console.error(`User ${name} not found.`);
    process.exit(1);
  }
  setUser(name);
  return user;
}
