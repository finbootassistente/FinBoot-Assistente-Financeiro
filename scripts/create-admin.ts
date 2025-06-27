import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function createAdmin() {
  try {
    // Check if admin already exists
    const [existingAdmin] = await db.select().from(users).where(eq(users.email, 'admin@finbot.com'));
    
    if (existingAdmin) {
      console.log("Admin user already exists");
      return;
    }
    
    // Hash the password
    const hashedPassword = await hashPassword('admin123');
    
    // Create admin user
    const [admin] = await db
      .insert(users)
      .values({
        name: 'Administrator',
        email: 'admin@finbot.com',
        password: hashedPassword,
        isAdmin: true,
      })
      .returning();
    
    console.log("Admin user created successfully:", {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      isAdmin: admin.isAdmin,
    });
  } catch (error) {
    console.error("Error creating admin user:", error);
  }
}

createAdmin().then(() => process.exit(0));