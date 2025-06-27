import OpenAI from "openai";
import type { Transaction } from "@shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Sistema de fallback inteligente para quando a OpenAI não está disponível
function generateIntelligentFallback(userMessage: string, userData?: any): string {
  const message = userMessage.toLowerCase();
  
  // Análise de padrões na mensagem do usuário
  if (message.includes('saldo') || message.includes('quanto tenho')) {
    return `Seu saldo atual é de R$ ${userData?.balance || '0,00'}. ${userData?.balance > 0 ? 'Você está com saldo positivo!' : 'Considere revisar seus gastos.'}`;
  }
  
  if (message.includes('gasto') || message.includes('gastei') || message.includes('despesa')) {
    return `Seus gastos recentes mostram padrões interessantes. Para otimizar suas finanças, sugiro categorizar melhor seus gastos e definir metas mensais. Use o dashboard para visualizar onde está gastando mais.`;
  }
  
  if (message.includes('economizar') || message.includes('poupar')) {
    return `Dicas para economizar:\n• Defina uma meta de economia mensal\n• Categorize seus gastos essenciais vs supérfluos\n• Use a regra 50-30-20 (necessidades-desejos-poupança)\n• Revise gastos recorrentes mensalmente`;
  }
  
  if (message.includes('investir') || message.includes('investimento')) {
    return `Para começar a investir:\n• Primeiro, quite dívidas de alto juros\n• Monte uma reserva de emergência\n• Estude produtos de baixo risco (Tesouro Direto, CDB)\n• Diversifique gradualmente seus investimentos`;
  }
  
  if (message.includes('dívida') || message.includes('dever')) {
    return `Para lidar com dívidas:\n• Liste todas as dívidas com juros\n• Priorize quitar as de maior juros\n• Negocie parcelamentos se necessário\n• Evite contrair novas dívidas`;
  }
  
  if (message.includes('orçamento') || message.includes('planejar')) {
    return `Planejamento financeiro:\n• Registre todas as receitas e despesas\n• Defina limites por categoria\n• Revise mensalmente seu orçamento\n• Use o FinBot para acompanhar seus progressos`;
  }
  
  if (message.includes('receita') || message.includes('renda') || message.includes('ganho')) {
    return `Para aumentar sua receita:\n• Diversifique suas fontes de renda\n• Invista em capacitação profissional\n• Considere trabalhos extras ou freelances\n• Monitore oportunidades de aumento salarial`;
  }
  
  if (message.includes('categoria') || message.includes('onde gasto')) {
    return `Para analisar seus gastos por categoria:\n• Acesse o Dashboard para ver gráficos detalhados\n• Identifique suas maiores categorias de gasto\n• Defina limites por categoria\n• Monitore mensalmente suas tendências`;
  }
  
  if (message.includes('meta') || message.includes('objetivo')) {
    return `Definindo metas financeiras:\n• Estabeleça metas SMART (específicas, mensuráveis, atingíveis)\n• Comece com metas de curto prazo (30-90 dias)\n• Use o FinBot para acompanhar seu progresso\n• Celebre pequenas conquistas no caminho`;
  }
  
  // Análise contextual baseada em dados do usuário
  if (userData?.totalExpenses > userData?.totalIncome) {
    return `Atenção: Seus gastos estão superiores à sua renda. Sugiro revisar despesas não essenciais e criar um plano de redução de custos. Posso ajudar a identificar onde cortar gastos.`;
  }
  
  if (userData?.balance > 1000) {
    return `Parabéns! Você tem um saldo positivo de R$ ${userData.balance.toFixed(2)}. Considere:\n• Separar parte para emergências\n• Investir em produtos conservadores\n• Definir metas de poupança mensais`;
  }
  
  // Resposta padrão mais inteligente
  return `Como seu assistente financeiro, estou aqui para ajudar! Posso te auxiliar com:\n\n• Controle de gastos e receitas\n• Análise de padrões financeiros\n• Dicas de economia e investimento\n• Planejamento orçamentário\n• Estratégias para quitar dívidas\n\nSobre o que gostaria de conversar especificamente?`;
}

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

// Interface para comandos de transação
export interface TransactionCommand {
  action: 'create_transaction' | 'query_data' | 'general_chat';
  transactionData?: {
    type: 'income' | 'expense';
    amount: number;
    description: string;
    category: string;
    date: string;
  };
  queryType?: 'balance' | 'expenses' | 'income' | 'category' | 'period';
  chatResponse: string;
}

// Função para interpretar comandos financeiros usando regex e fallback IA
export async function interpretarComandoFinanceiro(mensagem: string, userData?: any): Promise<TransactionCommand> {
  // Regex patterns para detectar transações
  const gastoRegex = /(?:gastei|comprei|paguei|despesa|gasto)\s+(?:r\$\s*)?(\d+(?:[\.,]\d{1,2})?)\s*(?:reais?)?\s*(?:com|no|na|em|de|para|pro)?\s*(.*)?/i;
  const receitaRegex = /(?:recebi|ganhei|salário|renda|entrada)\s+(?:r\$\s*)?(\d+(?:[\.,]\d{1,2})?)\s*(?:reais?)?\s*(?:do|da|de|em)?\s*(.*)?/i;
  
  // Regex para consultas
  const saldoRegex = /(?:qual|meu|ver|consultar)\s*(?:o|meu)?\s*(?:saldo|dinheiro)/i;
  const extratoRegex = /(?:extrato|quanto|gastos?)\s*(?:do|da|no|na)?\s*(?:mês|semana|hoje|ontem)/i;
  
  let tipo = null;
  let valor = null;
  let categoria = "Outros";
  let descricao = "";

  // Verificar se é gasto/despesa
  if (gastoRegex.test(mensagem)) {
    const match = mensagem.match(gastoRegex);
    if (match) {
      tipo = "expense";
      valor = parseFloat(match[1].replace(",", "."));
      const contexto = match[2]?.trim() || "";
      
      // Categorizar baseado no contexto
      categoria = categorizarTransacao(contexto, tipo);
      descricao = contexto || "Despesa";

      return {
        action: 'create_transaction',
        transactionData: {
          type: 'expense',
          amount: valor,
          description: descricao,
          category: categoria,
          date: new Date().toISOString().split('T')[0]
        },
        chatResponse: `✅ **Despesa detectada!**\n\n💰 Valor: R$ ${valor.toFixed(2)}\n📝 Descrição: ${descricao}\n🏷️ Categoria: ${categoria}\n\nVou registrar para você agora!`
      };
    }
  }

  // Verificar se é receita
  if (receitaRegex.test(mensagem)) {
    const match = mensagem.match(receitaRegex);
    if (match) {
      tipo = "income";
      valor = parseFloat(match[1].replace(",", "."));
      const contexto = match[2]?.trim() || "";
      
      categoria = categorizarTransacao(contexto, tipo);
      descricao = contexto || "Receita";

      return {
        action: 'create_transaction',
        transactionData: {
          type: 'income',
          amount: valor,
          description: descricao,
          category: categoria,
          date: new Date().toISOString().split('T')[0]
        },
        chatResponse: `✅ **Receita detectada!**\n\n💰 Valor: R$ ${valor.toFixed(2)}\n📝 Descrição: ${descricao}\n🏷️ Categoria: ${categoria}\n\nVou registrar para você agora!`
      };
    }
  }

  // Verificar consultas de saldo
  if (saldoRegex.test(mensagem)) {
    return {
      action: 'query_data',
      queryType: 'balance',
      chatResponse: 'Consultando seu saldo atual...'
    };
  }

  // Verificar consultas de extrato
  if (extratoRegex.test(mensagem)) {
    return {
      action: 'query_data',
      queryType: 'period',
      chatResponse: 'Gerando extrato dos seus gastos...'
    };
  }

  // Se não detectou nada específico, tentar usar IA como fallback (se disponível)
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Analise se a mensagem é um comando financeiro. Responda apenas "SIM" ou "NÃO". Se for SIM, identifique o tipo (gasto/receita), valor e categoria.`
        },
        {
          role: "user",
          content: mensagem
        }
      ],
      max_tokens: 100,
      temperature: 0.1
    });

    // Se a IA identificou algo, processar
    const aiResponse = response.choices[0].message.content?.toLowerCase();
    if (aiResponse?.includes('sim')) {
      return {
        action: 'general_chat',
        chatResponse: 'Entendi que você quer registrar algo financeiro, mas não consegui identificar o valor exato. Tente usar um formato como: "gastei 50 reais com mercado" ou "recebi 1200 do salário".'
      };
    }
  } catch (error) {
    console.log("IA não disponível, usando fallback local");
  }

  // Fallback para chat geral
  return {
    action: 'general_chat',
    chatResponse: generateIntelligentFallback(mensagem, userData)
  };
}

// Função auxiliar para categorizar automaticamente
function categorizarTransacao(contexto: string, tipo: string): string {
  const contextoLower = contexto.toLowerCase();
  
  // Categorias para despesas
  if (tipo === 'expense') {
    if (contextoLower.includes('mercado') || contextoLower.includes('supermercado') || 
        contextoLower.includes('comida') || contextoLower.includes('restaurante') ||
        contextoLower.includes('lanche') || contextoLower.includes('pizza')) {
      return 'Alimentação';
    }
    if (contextoLower.includes('uber') || contextoLower.includes('táxi') || 
        contextoLower.includes('ônibus') || contextoLower.includes('gasolina') ||
        contextoLower.includes('combustível') || contextoLower.includes('transporte')) {
      return 'Transporte';
    }
    if (contextoLower.includes('aluguel') || contextoLower.includes('casa') || 
        contextoLower.includes('conta') || contextoLower.includes('energia') ||
        contextoLower.includes('água') || contextoLower.includes('internet')) {
      return 'Casa';
    }
    if (contextoLower.includes('médico') || contextoLower.includes('farmácia') || 
        contextoLower.includes('remédio') || contextoLower.includes('consulta')) {
      return 'Saúde';
    }
    if (contextoLower.includes('cinema') || contextoLower.includes('festa') || 
        contextoLower.includes('balada') || contextoLower.includes('jogo')) {
      return 'Lazer';
    }
    if (contextoLower.includes('roupa') || contextoLower.includes('sapato') || 
        contextoLower.includes('compra') || contextoLower.includes('loja')) {
      return 'Compras';
    }
  }
  
  // Categorias para receitas
  if (tipo === 'income') {
    if (contextoLower.includes('salário') || contextoLower.includes('trabalho') || 
        contextoLower.includes('emprego')) {
      return 'Trabalho';
    }
    if (contextoLower.includes('freelance') || contextoLower.includes('extra') || 
        contextoLower.includes('projeto')) {
      return 'Trabalho';
    }
  }
  
  return 'Outros';
}

// Função para gerar consultas de dados
export async function gerarConsultaDados(queryType: string, userData: any, transactions: any[]): Promise<string> {
  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();

  switch (queryType) {
    case 'balance':
      return `💰 **Seu Saldo Atual**\nSaldo: R$ ${userData.balance?.toFixed(2) || '0,00'}\n\n${userData.balance > 0 ? '✅ Você está com saldo positivo!' : '⚠️ Considere revisar seus gastos.'}`;

    case 'expenses':
      const totalGastos = userData.totalExpenses || 0;
      return `📊 **Seus Gastos**\nTotal gasto: R$ ${totalGastos.toFixed(2)}\nNúmero de transações: ${transactions.filter(t => t.type === 'expense').length}\n\n💡 Dica: Use o dashboard para ver o gráfico por categorias!`;

    case 'period':
      const gastosDoMes = transactions
        .filter(t => {
          const data = new Date(t.date);
          return t.type === 'expense' && data.getMonth() === mesAtual && data.getFullYear() === anoAtual;
        })
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      return `📅 **Extrato do Mês**\nGastos em ${hoje.toLocaleDateString('pt-BR', { month: 'long' })}: R$ ${gastosDoMes.toFixed(2)}\nSaldo atual: R$ ${userData.balance?.toFixed(2) || '0,00'}\n\n📈 Compare com meses anteriores no dashboard!`;

    default:
      return `📋 **Resumo Financeiro**\n• Saldo: R$ ${userData.balance?.toFixed(2) || '0,00'}\n• Receitas: R$ ${userData.totalIncome?.toFixed(2) || '0,00'}\n• Gastos: R$ ${userData.totalExpenses?.toFixed(2) || '0,00'}\n\n🎯 Continue acompanhando suas finanças!`;
  }
}

// Nova função para resposta inteligente da IA
export async function gerarResposta(mensagemUsuario: string, userData?: any): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `Você é o FinBot, um assistente financeiro inteligente e amigável. Características:
          - Seja direto, prático e gentil
          - Ofereça dicas financeiras personalizadas
          - Use dados do usuário quando disponíveis
          - Mantenha tom conversacional e motivador
          - Foque em educação financeira prática
          - Responda em português brasileiro
          - Use emojis para deixar as respostas mais amigáveis`
        },
        {
          role: "user",
          content: `${mensagemUsuario}${userData ? `\n\nDados do usuário: Saldo: R$ ${userData.balance || 0}, Gastos totais: R$ ${userData.totalExpenses || 0}, Receitas: R$ ${userData.totalIncome || 0}` : ''}`
        }
      ],
      max_tokens: 300,
      temperature: 0.7
    });

    return response.choices[0].message.content || generateIntelligentFallback(mensagemUsuario, userData);
  } catch (error) {
    console.error("Erro na OpenAI, usando fallback inteligente:", error);
    return generateIntelligentFallback(mensagemUsuario, userData);
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