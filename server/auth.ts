import { Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { registerSchema, loginSchema, type RegisterData, type LoginData, type User } from "@shared/schema";
import connectPg from "connect-pg-simple";

declare global {
  namespace Express {
    interface User {
      id: number;
      name: string;
      email: string;
      password: string;
      isAdmin: boolean | null;
      createdAt: Date | null;
      updatedAt: Date | null;
    }
  }
}

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  return session({
    secret: process.env.SESSION_SECRET || "your-secret-key-here",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      maxAge: sessionTtl,
    },
  });
}

export async function registerUser(req: Request, res: Response) {
  try {
    const validatedData = registerSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(validatedData.email);
    if (existingUser) {
      return res.status(400).json({ message: "Email já está em uso" });
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(validatedData.password);
    const user = await storage.createUser({
      name: validatedData.name,
      email: validatedData.email,
      password: hashedPassword,
    });

    // Log user in
    req.session.userId = user.id;
    
    // Return user without password
    const { password, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        message: "Dados inválidos",
        errors: error.errors 
      });
    }
    res.status(500).json({ message: "Erro interno do servidor" });
  }
}

export async function loginUser(req: Request, res: Response) {
  try {
    const validatedData = loginSchema.parse(req.body);
    
    // Find user by email
    const user = await storage.getUserByEmail(validatedData.email);
    if (!user) {
      return res.status(401).json({ message: "Email ou senha incorretos" });
    }

    // Check password
    const isValidPassword = await comparePasswords(validatedData.password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Email ou senha incorretos" });
    }

    // Log user in
    req.session.userId = user.id;
    
    // Return user without password
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        message: "Dados inválidos",
        errors: error.errors 
      });
    }
    res.status(500).json({ message: "Erro interno do servidor" });
  }
}

export function logoutUser(req: Request, res: Response) {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Erro ao fazer logout" });
    }
    res.clearCookie('connect.sid');
    res.json({ message: "Logout realizado com sucesso" });
  });
}

export async function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Não autorizado" });
  }

  try {
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "Usuário não encontrado" });
    }
    
    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ message: "Erro interno do servidor" });
  }
}

export async function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: "Acesso de administrador necessário" });
  }
  next();
}