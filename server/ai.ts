import OpenAI from "openai";
import type { Transaction } from "@shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface FinancialInsight {
  type: 'warning' | 'tip' | 'achievement' | 'suggestion';
  title: string;
  description: string;
  category?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface SpendingAnalysis {
  insights: FinancialInsight[];
  summary: {
    totalSpent: number;
    topCategories: Array<{ category: string; amount: number; percentage: number }>;
    spendingTrend: 'increasing' | 'decreasing' | 'stable';
    monthlyAverage: number;
  };
}

export async function analyzeUserSpending(
  transactions: Transaction[],
  userId: number
): Promise<SpendingAnalysis> {
  try {
    // Calcular estatísticas básicas
    const expenses = transactions.filter(t => t.type === 'expense');
    const totalSpent = expenses.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    // Agrupar por categoria
    const categoryTotals = expenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + parseFloat(t.amount);
      return acc;
    }, {} as Record<string, number>);
    
    const topCategories = Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: (amount / totalSpent) * 100
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Analisar tendência dos últimos 30 dias
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    const recentExpenses = expenses.filter(t => new Date(t.date) >= last30Days);
    const monthlyAverage = recentExpenses.reduce((sum, t) => sum + parseFloat(t.amount), 0);

    // Preparar dados para análise da IA
    const analysisData = {
      totalTransactions: transactions.length,
      totalSpent,
      topCategories,
      monthlyAverage,
      recentTransactions: recentExpenses.slice(-10).map(t => ({
        category: t.category,
        amount: parseFloat(t.amount),
        description: t.description,
        date: t.date
      }))
    };

    // Chamar IA para análise
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `Você é um assistente financeiro especializado em análise de gastos pessoais. 
          Analise os dados financeiros do usuário e forneça insights personalizados e actionáveis.
          Responda em JSON com o formato: {
            "insights": [
              {
                "type": "warning|tip|achievement|suggestion",
                "title": "título curto",
                "description": "descrição detalhada",
                "category": "categoria opcional",
                "priority": "low|medium|high"
              }
            ],
            "spendingTrend": "increasing|decreasing|stable"
          }
          
          Foque em:
          - Identificar padrões de gastos
          - Sugerir economias específicas
          - Alertar sobre gastos excessivos
          - Parabenizar por bons hábitos
          - Dar dicas práticas de economia
          
          Use linguagem brasileira clara e amigável.`
        },
        {
          role: "user",
          content: `Analise estes dados financeiros: ${JSON.stringify(analysisData)}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000
    });

    const aiAnalysis = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      insights: aiAnalysis.insights || [],
      summary: {
        totalSpent,
        topCategories,
        spendingTrend: aiAnalysis.spendingTrend || 'stable',
        monthlyAverage
      }
    };

  } catch (error) {
    console.error('Erro na análise de IA:', error);
    
    // Fallback para análise básica sem IA
    const expenses = transactions.filter(t => t.type === 'expense');
    const totalSpent = expenses.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const categoryTotals = expenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + parseFloat(t.amount);
      return acc;
    }, {} as Record<string, number>);
    
    const topCategories = Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: (amount / totalSpent) * 100
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    const basicInsights: FinancialInsight[] = [];
    
    // Insights básicos sem IA
    if (totalSpent > 5000) {
      basicInsights.push({
        type: 'warning',
        title: 'Gastos Elevados',
        description: 'Você gastou mais de R$ 5.000 recentemente. Considere revisar seus gastos.',
        priority: 'high'
      });
    }

    if (topCategories.length > 0 && topCategories[0].percentage > 50) {
      basicInsights.push({
        type: 'tip',
        title: `Concentração em ${topCategories[0].category}`,
        description: `Mais de 50% dos seus gastos estão em ${topCategories[0].category}. Diversifique seus gastos.`,
        category: topCategories[0].category,
        priority: 'medium'
      });
    }

    return {
      insights: basicInsights,
      summary: {
        totalSpent,
        topCategories,
        spendingTrend: 'stable',
        monthlyAverage: totalSpent
      }
    };
  }
}

export async function generateDailySummary(
  userName: string,
  todaySpent: number,
  currentBalance: number
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "Você é um assistente financeiro amigável. Crie um resumo diário personalizado e motivador em português brasileiro."
        },
        {
          role: "user",
          content: `Crie um resumo diário para ${userName}. Gastos hoje: R$ ${todaySpent.toFixed(2)}, Saldo atual: R$ ${currentBalance.toFixed(2)}`
        }
      ],
      max_tokens: 150
    });

    return response.choices[0].message.content || `Olá ${userName}! Hoje você gastou R$ ${todaySpent.toFixed(2)} e seu saldo atual é R$ ${currentBalance.toFixed(2)}.`;
  } catch (error) {
    console.error('Erro ao gerar resumo diário:', error);
    return `Olá ${userName}! Hoje você gastou R$ ${todaySpent.toFixed(2)} e seu saldo atual é R$ ${currentBalance.toFixed(2)}.`;
  }
}