import { users, transactions, type User, type InsertUser, type Transaction, type InsertTransaction } from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserLastAccess(id: number): Promise<void>;
  
  // Transaction operations
  getTransaction(id: number): Promise<Transaction | undefined>;
  getTransactionsByUser(userId: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private transactions: Map<number, Transaction>;
  private currentUserId: number;
  private currentTransactionId: number;

  constructor() {
    this.users = new Map();
    this.transactions = new Map();
    this.currentUserId = 1;
    this.currentTransactionId = 1;
    
    // Create a default user for demo purposes
    this.createUser({
      name: "Demo User",
      email: "demo@finbot.com"
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = {
      ...insertUser,
      id,
      status: "active",
      createdAt: now,
      lastAccess: now,
    };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUserLastAccess(id: number): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.lastAccess = new Date();
      this.users.set(id, user);
    }
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async getTransactionsByUser(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(transaction => transaction.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentTransactionId++;
    const transaction: Transaction = {
      ...insertTransaction,
      id,
      createdAt: new Date(),
    };
    this.transactions.set(id, transaction);
    return transaction;
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
    const userTransactions = await this.getTransactionsByUser(userId);
    return userTransactions.slice(0, limit);
  }

  async getAdminStats(): Promise<{
    totalUsers: number;
    activeToday: number;
    newThisMonth: number;
    retentionRate: number;
  }> {
    const allUsers = Array.from(this.users.values());
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const activeToday = allUsers.filter(user => 
      new Date(user.lastAccess) >= startOfToday
    ).length;

    const newThisMonth = allUsers.filter(user => 
      new Date(user.createdAt) >= startOfMonth
    ).length;

    const activeUsers = allUsers.filter(user => user.status === 'active').length;
    const retentionRate = allUsers.length > 0 ? Math.round((activeUsers / allUsers.length) * 100) : 0;

    return {
      totalUsers: allUsers.length,
      activeToday,
      newThisMonth,
      retentionRate,
    };
  }
}

export const storage = new MemStorage();
