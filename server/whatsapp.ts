import express from "express";
import axios from "axios";
import { storage } from "./storage";
import { interpretarComandoFinanceiro, gerarConsultaDados } from "./ai";
import { insertTransactionSchema } from "@shared/schema";

// Configurações do WhatsApp Business API
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "finbot_webhook_verify_2025";
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

// Mapeamento de números de telefone para usuários
const phoneToUserMap = new Map<string, number>();

// Função para associar número do WhatsApp ao usuário
export function linkPhoneToUser(phoneNumber: string, userId: number) {
  phoneToUserMap.set(phoneNumber, userId);
}

// Função para buscar usuário pelo número do WhatsApp
function getUserByPhone(phoneNumber: string): number | null {
  return phoneToUserMap.get(phoneNumber) || null;
}

// Função para enviar mensagem via WhatsApp usando API direta
export async function sendWhatsAppMessage(to: string, message: string) {
  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
    console.log("WhatsApp não configurado - simulando envio:", message);
    return;
  }

  try {
    const url = `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`;
    
    const payload = {
      messaging_product: "whatsapp",
      to: to,
      type: "text",
      text: {
        body: message
      }
    };

    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`Mensagem enviada para ${to}: ${message}`);
    return response.data;
  } catch (error) {
    console.error("Erro ao enviar mensagem WhatsApp:", error);
    throw error;
  }
}

// Função para processar mensagens recebidas do WhatsApp
export async function processWhatsAppMessage(from: string, messageBody: string): Promise<string> {
  try {
    // Buscar usuário pelo número de telefone
    let userId = getUserByPhone(from);
    
    // Se usuário não encontrado, criar um novo (opcional)
    if (!userId) {
      // Por enquanto, vamos retornar uma mensagem de instrução
      return `👋 Olá! Para usar o FinBot pelo WhatsApp, você precisa primeiro fazer login na plataforma web e vincular seu número.\n\n🌐 Acesse: sua-url-do-app.com\n\n📱 Depois você poderá usar comandos como:\n• "gastei 50 reais com mercado"\n• "recebi 1200 do salário"\n• "qual meu saldo?"`;
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
    const comando = await interpretarComandoFinanceiro(messageBody, userData);
    
    let resposta = comando.chatResponse;

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
        const transactionCreated = await storage.createTransaction({
          ...validatedData,
          userId,
        });

        // Atualizar resumo após criação
        const updatedSummary = await storage.getUserSummary(userId);
        
        resposta = `✅ *Transação registrada via WhatsApp!*\n\n` +
          `💰 ${comando.transactionData.type === 'income' ? 'Receita' : 'Despesa'}: R$ ${comando.transactionData.amount.toFixed(2)}\n` +
          `📝 Descrição: ${comando.transactionData.description}\n` +
          `🏷️ Categoria: ${comando.transactionData.category}\n` +
          `📅 Data: ${new Date(comando.transactionData.date).toLocaleDateString('pt-BR')}\n\n` +
          `💳 *Saldo atualizado:* R$ ${updatedSummary.balance.toFixed(2)}\n\n` +
          `🚀 Continue enviando comandos pelo WhatsApp para controlar suas finanças!`;

      } catch (error) {
        console.error("Erro ao criar transação via WhatsApp:", error);
        resposta = `❌ *Ops! Erro ao registrar a transação.*\n\n` +
          `Mas entendi que você quer registrar:\n` +
          `• ${comando.transactionData.type === 'income' ? 'Receita' : 'Despesa'} de R$ ${comando.transactionData.amount.toFixed(2)}\n` +
          `• Descrição: ${comando.transactionData.description}\n` +
          `• Categoria: ${comando.transactionData.category}\n\n` +
          `💡 Tente novamente ou acesse a plataforma web.`;
      }
    } else if (comando.action === 'query_data' && comando.queryType) {
      // Gerar consulta de dados
      resposta = await gerarConsultaDados(comando.queryType, userData, allTransactions);
    }

    return resposta;

  } catch (error) {
    console.error("Erro ao processar mensagem WhatsApp:", error);
    return `❌ Ops! Ocorreu um erro ao processar sua mensagem. Tente novamente.\n\n💡 Use comandos como:\n• "gastei 50 reais com mercado"\n• "recebi 1200 do salário"\n• "qual meu saldo?"`;
  }
}

// Configurar rotas do webhook do WhatsApp
export function setupWhatsAppWebhook(app: express.Application) {
  // Verificação do webhook (GET)
  app.get('/webhook/whatsapp', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WhatsApp webhook verificado com sucesso!');
      res.status(200).send(challenge);
    } else {
      console.error('Falha na verificação do webhook WhatsApp');
      res.sendStatus(403);
    }
  });

  // Receber mensagens do webhook (POST)
  app.post('/webhook/whatsapp', async (req, res) => {
    try {
      const body = req.body;

      if (body.object === 'whatsapp_business_account') {
        const entries = body.entry || [];
        
        for (const entry of entries) {
          const changes = entry.changes || [];
          
          for (const change of changes) {
            if (change.value?.messages) {
              const messages = change.value.messages;
              
              for (const message of messages) {
                const from = message.from;
                const messageBody = message.text?.body;
                
                if (messageBody) {
                  console.log(`Mensagem WhatsApp recebida de ${from}: ${messageBody}`);
                  
                  // Processar mensagem e gerar resposta
                  const resposta = await processWhatsAppMessage(from, messageBody);
                  
                  // Enviar resposta de volta
                  await sendWhatsAppMessage(from, resposta);
                }
              }
            }
          }
        }
        
        res.status(200).send('EVENT_RECEIVED');
      } else {
        res.sendStatus(404);
      }
    } catch (error) {
      console.error('Erro no webhook WhatsApp:', error);
      res.sendStatus(500);
    }
  });

  console.log('🔗 WhatsApp webhook configurado em /webhook/whatsapp');
  console.log('📱 Token de verificação:', VERIFY_TOKEN);
}

// Função para comandos administrativos do WhatsApp
export async function sendBroadcastMessage(message: string, userIds: number[]) {
  // Esta função seria usada para enviar mensagens em massa
  console.log(`Enviando mensagem broadcast para ${userIds.length} usuários: ${message}`);
  
  for (const userId of userIds) {
    // Buscar número do WhatsApp associado ao usuário
    for (const [phone, id] of Array.from(phoneToUserMap.entries())) {
      if (id === userId) {
        await sendWhatsAppMessage(phone, message);
        break;
      }
    }
  }
}