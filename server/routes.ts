import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTransactionSchema } from "@shared/schema";
import { getSession, registerUser, loginUser, logoutUser, isAuthenticated, isAdmin } from "./auth";
import { analyzeUserSpending, interpretarComandoFinanceiro, gerarConsultaDados } from "./ai";
import { setupWhatsAppWebhook, linkPhoneToUser } from "./whatsapp";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.set("trust proxy", 1);
  app.use(getSession());

  // Configurar webhook do WhatsApp
  setupWhatsAppWebhook(app);

  // Auth routes
  app.post("/api/register", registerUser);
  app.post("/api/login", loginUser);
  app.post("/api/logout", logoutUser);
  app.get("/api/logout", logoutUser); // Support GET for direct browser navigation
  
  // Get current user
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const { password, ...userWithoutPassword } = req.user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Check if user is admin
  app.get('/api/auth/is-admin', isAuthenticated, async (req: any, res) => {
    try {
      res.json({ isAdmin: req.user?.isAdmin || false });
    } catch (error) {
      console.error("Error checking admin status:", error);
      res.status(500).json({ message: "Failed to check admin status" });
    }
  });

  // Get user summary (dashboard data)
  app.get("/api/user/summary", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const summary = await storage.getUserSummary(userId);
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get recent transactions
  app.get("/api/transactions/recent", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const transactions = await storage.getRecentTransactions(userId, limit);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get all user transactions
  app.get("/api/transactions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const transactions = await storage.getTransactionsByUser(userId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create new transaction
  app.post("/api/transactions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = insertTransactionSchema.parse(req.body);

      const transaction = await storage.createTransaction({
        ...validatedData,
        userId,
      });
      
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid transaction data",
          errors: error.errors 
        });
      }
      res.status(500).json({ 
        message: "Internal server error"
      });
    }
  });

  // Update transaction
  app.put("/api/transactions/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId!;
      const updateData = insertTransactionSchema.parse(req.body);
      
      const updatedTransaction = await storage.updateTransaction(id, updateData, userId);
      
      if (!updatedTransaction) {
        return res.status(404).json({ message: "Transação não encontrada" });
      }
      
      res.json(updatedTransaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      res.status(500).json({ 
        message: "Internal server error"
      });
    }
  });

  // Delete transaction
  app.delete("/api/transactions/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId!;
      
      const deleted = await storage.deleteTransaction(id, userId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Transação não encontrada" });
      }
      
      res.json({ message: "Transação excluída com sucesso" });
    } catch (error) {
      res.status(500).json({ 
        message: "Internal server error"
      });
    }
  });

  // Admin routes
  app.get("/api/admin/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords from response
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/stats", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // AI Analysis routes
  app.get("/api/ai/analysis", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const transactions = await storage.getTransactionsByUser(userId);
      const analysis = await analyzeUserSpending(transactions, userId);
      res.json(analysis);
    } catch (error) {
      console.error("Error in AI analysis:", error);
      res.status(500).json({ message: "Erro ao analisar dados financeiros" });
    }
  });

  app.get("/api/ai/daily-summary", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      // Calcular gastos de hoje
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const transactions = await storage.getTransactionsByUser(userId);
      const todayTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= today && transactionDate < tomorrow;
      });
      
      const todaySpent = todayTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const summary = await storage.getUserSummary(userId);
      
      // Frases motivacionais e dicas financeiras alternando
      const motivationalPhrases = [
        "Continue assim, você está no caminho certo! 💪",
        "Pequenos passos hoje, grandes conquistas amanhã! 🌟",
        "Sua disciplina financeira está fazendo a diferença! 🎯",
        "Cada real economizado é um passo rumo à liberdade financeira! 🚀",
        "Você tem controle total sobre seu futuro financeiro! ✨",
        "Acredite em si mesmo, você é capaz de grandes conquistas! 🌈"
      ];

      const financialTips = [
        "💡 Dica: Reserve pelo menos 10% da sua renda para emergências.",
        "💡 Dica: Anote todos os gastos para ter controle total das finanças.",
        "💡 Dica: Compare preços antes de fazer compras maiores.",
        "💡 Dica: Invista em conhecimento financeiro, ele rende juros compostos.",
        "💡 Dica: Evite compras por impulso, espere 24h antes de decidir.",
        "💡 Dica: Automatize suas economias para criar o hábito de poupar."
      ];

      // Alternar entre frase motivacional e dica financeira
      const useMotivational = Math.random() < 0.5;
      const randomMessage = useMotivational 
        ? motivationalPhrases[Math.floor(Math.random() * motivationalPhrases.length)]
        : financialTips[Math.floor(Math.random() * financialTips.length)];
      
      const dailySummary = `Olá ${user?.name || "Usuário"}! Hoje você gastou R$ ${todaySpent.toFixed(2)} e seu saldo atual é R$ ${summary.balance.toFixed(2)}. ${randomMessage}`;
      
      res.json({
        summary: dailySummary,
        todaySpent,
        currentBalance: summary.balance,
        todayTransactionsCount: todayTransactions.length
      });
    } catch (error) {
      console.error("Error generating daily summary:", error);
      res.status(500).json({ message: "Erro ao gerar resumo diário" });
    }
  });

  // AI Chat route - Assistente Financeiro Inteligente
  app.post("/api/ai/chat", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { message } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ message: "Mensagem é obrigatória" });
      }

      // Buscar dados do usuário para contexto
      const summary = await storage.getUserSummary(userId);
      const user = await storage.getUser(userId);
      const allTransactions = await storage.getTransactionsByUser(userId);
      
      const userData = {
        balance: summary.balance,
        totalIncome: summary.totalIncome,
        totalExpenses: summary.totalExpenses,
        name: user?.name || "Usuário",
        recentTransactions: allTransactions.length
      };

      // Interpretar comando do usuário
      const comando = await interpretarComandoFinanceiro(message, userData);
      
      let resposta = comando.chatResponse;
      let transactionCreated = null;

      // Executar ação baseada no comando interpretado
      if (comando.action === 'create_transaction' && comando.transactionData) {
        try {
          // Criar transação automaticamente
          const transactionData = {
            type: comando.transactionData.type,
            amount: comando.transactionData.amount.toString(),
            description: comando.transactionData.description,
            category: comando.transactionData.category,
            date: comando.transactionData.date || new Date().toISOString().split('T')[0]
          };

          const validatedData = insertTransactionSchema.parse(transactionData);
          transactionCreated = await storage.createTransaction({
            ...validatedData,
            userId,
          });

          // Atualizar resumo após criação
          const updatedSummary = await storage.getUserSummary(userId);
          
          resposta = `✅ **Transação registrada com sucesso!**\n\n` +
            `💰 ${comando.transactionData.type === 'income' ? 'Receita' : 'Despesa'}: R$ ${comando.transactionData.amount.toFixed(2)}\n` +
            `📝 Descrição: ${comando.transactionData.description}\n` +
            `🏷️ Categoria: ${comando.transactionData.category}\n` +
            `📅 Data: ${new Date(comando.transactionData.date).toLocaleDateString('pt-BR')}\n\n` +
            `💳 **Saldo atualizado:** R$ ${updatedSummary.balance.toFixed(2)}\n\n` +
            `🚀 Continue registrando suas transações para ter um controle completo das suas finanças!`;

        } catch (error) {
          console.error("Erro ao criar transação automática:", error);
          resposta = `❌ **Ops! Não consegui registrar a transação.**\n\n` +
            `Mas entendi que você quer registrar:\n` +
            `• ${comando.transactionData.type === 'income' ? 'Receita' : 'Despesa'} de R$ ${comando.transactionData.amount.toFixed(2)}\n` +
            `• Descrição: ${comando.transactionData.description}\n` +
            `• Categoria: ${comando.transactionData.category}\n\n` +
            `💡 Você pode tentar novamente ou usar o botão "Nova Transação" no dashboard.`;
        }
      } else if (comando.action === 'query_data' && comando.queryType) {
        // Gerar consulta de dados
        resposta = await gerarConsultaDados(comando.queryType, userData, allTransactions);
      }

      res.json({ 
        response: resposta,
        transactionCreated,
        action: comando.action
      });
    } catch (error) {
      console.error("Erro no chat da IA:", error);
      res.status(500).json({ message: "Erro ao processar mensagem" });
    }
  });

  // WhatsApp Integration routes
  app.post("/api/whatsapp/link", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { phoneNumber } = req.body;
      
      if (!phoneNumber) {
        return res.status(400).json({ message: "Número de telefone é obrigatório" });
      }

      // Validar formato do número (deve incluir código do país)
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(phoneNumber)) {
        return res.status(400).json({ message: "Formato de número inválido. Use +5511999999999" });
      }

      // Vincular número ao usuário
      linkPhoneToUser(phoneNumber, userId);
      
      res.json({ 
        message: "Número vinculado com sucesso!",
        phoneNumber: phoneNumber,
        instructions: "Agora você pode enviar mensagens diretamente pelo WhatsApp para " + phoneNumber.replace(/(\+\d{2})(\d{2})(\d{5})(\d{4})/, "$1 ($2) $3-$4")
      });
    } catch (error) {
      console.error("Erro ao vincular WhatsApp:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Categories analytics
  app.get("/api/analytics/categories", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const transactions = await storage.getTransactionsByUser(userId);
      const expenses = transactions.filter(t => t.type === 'expense');
      
      const categoryTotals = expenses.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + parseFloat(t.amount);
        return acc;
      }, {} as Record<string, number>);
      
      const totalExpenses = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
      
      const categoriesData = Object.entries(categoryTotals)
        .map(([category, amount]) => ({
          category,
          amount,
          percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
        }))
        .sort((a, b) => b.amount - a.amount);

      res.json(categoriesData);
    } catch (error) {
      console.error("Error in categories analytics:", error);
      res.status(500).json({ message: "Erro ao analisar categorias" });
    }
  });

  // Monthly trends
  app.get("/api/analytics/trends", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const transactions = await storage.getTransactionsByUser(userId);
      
      // Agrupar por mês
      const monthlyData = transactions.reduce((acc, t) => {
        const date = new Date(t.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!acc[monthKey]) {
          acc[monthKey] = { income: 0, expenses: 0, month: monthKey };
        }
        
        const amount = parseFloat(t.amount);
        if (t.type === 'income') {
          acc[monthKey].income += amount;
        } else {
          acc[monthKey].expenses += amount;
        }
        
        return acc;
      }, {} as Record<string, { income: number; expenses: number; month: string }>);

      const trendsData = Object.values(monthlyData)
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-6); // Últimos 6 meses

      res.json(trendsData);
    } catch (error) {
      console.error("Error in trends analytics:", error);
      res.status(500).json({ message: "Erro ao analisar tendências" });
    }
  });

  // Admin analytics for charts
  app.get("/api/admin/analytics", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      
      // User registration by month
      const registrationData = users.reduce((acc, user) => {
        if (user.createdAt) {
          const date = new Date(user.createdAt);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          acc[monthKey] = (acc[monthKey] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const chartData = Object.entries(registrationData)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([month, count]) => ({
          month,
          users: count
        }));

      // User status distribution
      const activeUsers = users.filter(u => {
        if (!u.updatedAt) return false;
        const lastActivity = new Date(u.updatedAt);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return lastActivity >= weekAgo;
      }).length;

      const inactiveUsers = users.length - activeUsers;
      
      const statusData = [
        { name: 'Ativos', value: activeUsers, color: '#25D366' },
        { name: 'Inativos', value: inactiveUsers, color: '#ECE5DD' }
      ];

      res.json({
        registrationChart: chartData,
        statusChart: statusData,
        totalUsers: users.length
      });
    } catch (error) {
      console.error("Error in admin analytics:", error);
      res.status(500).json({ message: "Erro ao carregar analytics" });
    }
  });

  // Send message to user (simulated)
  app.post("/api/admin/send-message", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { userId, title, content } = req.body;
      
      if (!userId || !title || !content) {
        return res.status(400).json({ message: "Dados obrigatórios em falta" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Em uma implementação real, isso enviaria um email ou notificação push
      // Por agora, apenas simulamos o envio
      console.log(`Message sent to user ${user.name} (${user.email}): ${title} - ${content}`);

      res.json({ 
        message: "Mensagem enviada com sucesso",
        recipient: user.name,
        title,
        content
      });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Erro ao enviar mensagem" });
    }
  });

  // AI Chat endpoint
  app.post("/api/ai/chat", isAuthenticated, async (req: any, res) => {
    try {
      const { message } = req.body;
      const userId = req.user?.id || req.session.userId;
      
      // Get user's recent transactions for context
      const transactions = await storage.getTransactionsByUser(userId);
      const summary = await storage.getUserSummary(userId);
      
      // Simple AI response for now (can be enhanced with OpenAI when quota is available)
      let response = "";
      
      if (message.toLowerCase().includes("saldo") || message.toLowerCase().includes("balanço")) {
        response = `Seu saldo atual é de R$ ${summary.balance.toFixed(2)}. Você tem ${summary.transactionCount} transações registradas.`;
      } else if (message.toLowerCase().includes("gasto") || message.toLowerCase().includes("despesa")) {
        response = `Suas despesas totais são de R$ ${summary.totalExpenses.toFixed(2)}. Recomendo revisar suas categorias de gastos no dashboard.`;
      } else if (message.toLowerCase().includes("renda") || message.toLowerCase().includes("receita")) {
        response = `Sua renda total é de R$ ${summary.totalIncome.toFixed(2)}. Continue mantendo um bom controle das suas entradas!`;
      } else if (message.toLowerCase().includes("dica") || message.toLowerCase().includes("conselho")) {
        response = "Aqui estão algumas dicas financeiras: 1) Mantenha um orçamento mensal, 2) Reserve uma parte da renda para emergências, 3) Acompanhe seus gastos regularmente.";
      } else if (message.toLowerCase().includes("categoria")) {
        const expenses = transactions.filter(t => t.type === 'expense');
        const categoryTotals = expenses.reduce((acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + parseFloat(t.amount);
          return acc;
        }, {} as Record<string, number>);
        
        const topCategory = Object.entries(categoryTotals).sort(([,a], [,b]) => b - a)[0];
        if (topCategory) {
          response = `Sua categoria com maior gasto é "${topCategory[0]}" com R$ ${topCategory[1].toFixed(2)}. Considere analisar se há oportunidades de economia nesta área.`;
        } else {
          response = "Você ainda não tem transações registradas. Comece adicionando suas receitas e despesas!";
        }
      } else {
        response = "Entendi sua pergunta! Posso ajudar com informações sobre seu saldo, gastos, receitas, categorias e dicas financeiras. O que você gostaria de saber especificamente?";
      }
      
      res.json({ response });
    } catch (error) {
      console.error("Erro no chat IA:", error);
      res.status(500).json({ message: "Erro no chat" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}