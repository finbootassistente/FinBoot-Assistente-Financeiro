import { db } from "../server/db";
import { users } from "@shared/schema";
import * as crypto from "crypto";

async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.pbkdf2(password, salt, 1000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve(salt + ':' + derivedKey.toString('hex'));
    });
  });
}

async function createDemoUser() {
  try {
    // Hash the password
    const hashedPassword = await hashPassword("demo123");
    
    // Insert demo user
    const [demoUser] = await db
      .insert(users)
      .values({
        name: "Demo User",
        email: "demo@finbot.com",
        password: hashedPassword,
        isAdmin: false,
      })
      .returning()
      .onConflictDoNothing();

    console.log("Demo user created successfully:", {
      id: demoUser?.id,
      name: demoUser?.name,
      email: demoUser?.email,
      isAdmin: demoUser?.isAdmin
    });
  } catch (error) {
    console.error("Error creating demo user:", error);
  } finally {
    process.exit(0);
  }
}

createDemoUser();