import { users, transactions, type User, type UpsertUser, type Transaction, type InsertTransaction } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User operations (for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Transaction operations
  getTransaction(id: number): Promise<Transaction | undefined>;
  getTransactionsByUser(userId: string): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction & { userId: string }): Promise<Transaction>;
  getUserSummary(userId: string): Promise<{
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    transactionCount: number;
  }>;
  getRecentTransactions(userId: string, limit?: number): Promise<Transaction[]>;
  
  // Admin operations
  getAdminStats(): Promise<{
    totalUsers: number;
    activeToday: number;
    newThisMonth: number;
    retentionRate: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations (for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction;
  }

  async getTransactionsByUser(userId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(transactions.date);
  }

  async createTransaction(transactionData: InsertTransaction & { userId: string }): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values(transactionData)
      .returning();
    return transaction;
  }

  async getUserSummary(userId: string): Promise<{
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    transactionCount: number;
  }> {
    const userTransactions = await this.getTransactionsByUser(userId);
    
    let totalIncome = 0;
    let totalExpenses = 0;
    
    userTransactions.forEach(transaction => {
      const amount = parseFloat(transaction.amount);
      if (transaction.type === 'income') {
        totalIncome += amount;
      } else {
        totalExpenses += amount;
      }
    });

    return {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      transactionCount: userTransactions.length,
    };
  }

  async getRecentTransactions(userId: string, limit = 5): Promise<Transaction[]> {
    const userTransactions = await this.getTransactionsByUser(userId);
    return userTransactions.slice(0, limit);
  }

  async getAdminStats(): Promise<{
    totalUsers: number;
    activeToday: number;
    newThisMonth: number;
    retentionRate: number;
  }> {
    const allUsers = await this.getAllUsers();
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const newThisMonth = allUsers.filter(user => 
      user.createdAt && new Date(user.createdAt) >= startOfMonth
    ).length;

    const activeUsers = allUsers.filter(user => user.isAdmin !== null).length;
    const retentionRate = allUsers.length > 0 ? Math.round((activeUsers / allUsers.length) * 100) : 0;

    return {
      totalUsers: allUsers.length,
      activeToday: 0, // Would need to track last access in real app
      newThisMonth,
      retentionRate,
    };
  }
}

export const storage = new DatabaseStorage();
