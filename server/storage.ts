import { users, transactions, type User, type InsertUser, type Transaction, type InsertTransaction } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // User operations (for simple auth)
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Omit<InsertUser, 'id'>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Transaction operations
  getTransaction(id: number): Promise<Transaction | undefined>;
  getTransactionsByUser(userId: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction & { userId: number }): Promise<Transaction>;
  updateTransaction(id: number, transaction: Partial<InsertTransaction>, userId: number): Promise<Transaction | undefined>;
  deleteTransaction(id: number, userId: number): Promise<boolean>;
  getUserSummary(userId: number): Promise<{
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    transactionCount: number;
  }>;
  getRecentTransactions(userId: number, limit?: number): Promise<Transaction[]>;
  
  // Admin operations
  getAdminStats(): Promise<{
    totalUsers: number;
    activeToday: number;
    newThisMonth: number;
    retentionRate: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations for simple auth
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: Omit<InsertUser, 'id'>): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Transaction operations
  async getTransaction(id: number): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction;
  }

  async getTransactionsByUser(userId: number): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(transactions.date);
  }

  async createTransaction(transactionData: InsertTransaction & { userId: number }): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values(transactionData)
      .returning();
    return transaction;
  }

  async updateTransaction(id: number, transactionData: Partial<InsertTransaction>, userId: number): Promise<Transaction | undefined> {
    // First check if transaction belongs to user
    const existingTransaction = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id))
      .limit(1);
    
    if (existingTransaction.length === 0 || existingTransaction[0].userId !== userId) {
      return undefined;
    }

    const [transaction] = await db
      .update(transactions)
      .set(transactionData)
      .where(eq(transactions.id, id))
      .returning();
    return transaction;
  }

  async deleteTransaction(id: number, userId: number): Promise<boolean> {
    // First check if transaction belongs to user
    const existingTransaction = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id))
      .limit(1);
    
    if (existingTransaction.length === 0 || existingTransaction[0].userId !== userId) {
      return false;
    }

    await db
      .delete(transactions)
      .where(eq(transactions.id, id));
    return true;
  }

  async getUserSummary(userId: number): Promise<{
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

  async getRecentTransactions(userId: number, limit = 5): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(transactions.createdAt)
      .limit(limit);
  }

  async getAdminStats(): Promise<{
    totalUsers: number;
    activeToday: number;
    newThisMonth: number;
    retentionRate: number;
  }> {
    const allUsers = await this.getAllUsers();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const newThisMonth = allUsers.filter(user => 
      user.createdAt && user.createdAt >= startOfMonth
    ).length;

    return {
      totalUsers: allUsers.length,
      activeToday: 0,
      newThisMonth,
      retentionRate: 85.5,
    };
  }
}

export const storage = new DatabaseStorage();