import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTransactionSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get current user (for demo, always return user with ID 1)
  app.get("/api/user/current", async (req, res) => {
    try {
      const user = await storage.getUser(1);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      await storage.updateUserLastAccess(user.id);
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get user summary (dashboard data)
  app.get("/api/user/summary", async (req, res) => {
    try {
      const summary = await storage.getUserSummary(1);
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get recent transactions
  app.get("/api/transactions/recent", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const transactions = await storage.getRecentTransactions(1, limit);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get all user transactions
  app.get("/api/transactions", async (req, res) => {
    try {
      const transactions = await storage.getTransactionsByUser(1);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create new transaction
  app.post("/api/transactions", async (req, res) => {
    try {
      const validatedData = insertTransactionSchema.parse({
        ...req.body,
        userId: 1, // For demo, always assign to user 1
        date: req.body.date ? new Date(req.body.date) : new Date(),
      });

      const transaction = await storage.createTransaction(validatedData);
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid transaction data",
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin routes
  app.get("/api/admin/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/stats", async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
