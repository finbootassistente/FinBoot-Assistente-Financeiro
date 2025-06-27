# 📱 Configuração do WhatsApp Business API para FinBot

## 🚀 Visão Geral

O FinBot agora suporta integração completa com WhatsApp, permitindo que os usuários:
- Registrem transações diretamente pelo WhatsApp: "gastei 50 reais com mercado"
- Consultem saldo e extratos: "qual meu saldo?"
- Recebam confirmações automáticas de transações
- Usem todos os recursos do assistente financeiro via WhatsApp

## ⚙️ Configuração no Meta Developer Console

### 1. Criar App no Meta Developer Console

1. Acesse https://developers.facebook.com/
2. Clique em "My Apps" → "Create App"
3. Selecione "Business" como tipo de app
4. Preencha as informações do app
5. Adicione o produto "WhatsApp Business API"

### 2. Configurar WhatsApp Business API

1. No painel do app, vá para "WhatsApp" → "Getting Started"
2. Obtenha seu **Phone Number ID** (necessário para enviar mensagens)
3. Gere um **Access Token** permanente
4. Configure o número de telefone business

### 3. Configurar Webhook

1. Na seção "WhatsApp" → "Configuration"
2. Configure o webhook:
   - **Webhook URL**: `https://seu-dominio.replit.app/webhook/whatsapp`
   - **Verify Token**: `finbot_webhook_verify_2025` (ou customize)
3. Inscreva-se nos seguintes campos:
   - `messages`
   - `message_deliveries` 
   - `message_reads`

## 🔑 Variáveis de Ambiente

Adicione as seguintes variáveis de ambiente no seu projeto Replit:

```env
WHATSAPP_TOKEN=seu_access_token_permanente
WHATSAPP_PHONE_NUMBER_ID=seu_phone_number_id
WHATSAPP_VERIFY_TOKEN=finbot_webhook_verify_2025
```

### Como obter os valores:

1. **WHATSAPP_TOKEN**: 
   - No Meta Developer Console → WhatsApp → Getting Started
   - Gere um "Permanent Token" (não use temporary tokens)

2. **WHATSAPP_PHONE_NUMBER_ID**:
   - No Meta Developer Console → WhatsApp → Getting Started
   - Copie o "Phone Number ID" (não é o número de telefone)

3. **WHATSAPP_VERIFY_TOKEN**:
   - Use: `finbot_webhook_verify_2025` (ou crie seu próprio token único)

## 🔧 Testando a Integração

### 1. Verificar Webhook

1. No Meta Developer Console, teste a verificação do webhook
2. Deve retornar status 200 e aceitar o challenge

### 2. Testar Mensagens

1. No app, vá para o Dashboard
2. Use o componente "Integração WhatsApp"
3. Vincule seu número de telefone
4. Envie mensagens de teste:
   - "gastei 30 reais com almoço"
   - "recebi 1500 do freelance"
   - "qual meu saldo?"

## 📋 Comandos Suportados

### Registrar Despesas
- "gastei 50 reais com mercado"
- "comprei gasolina por 80 reais"
- "paguei 200 reais de conta de luz"

### Registrar Receitas
- "recebi 1200 do salário"
- "ganhei 500 de freelance"
- "entrada de 300 reais"

### Consultas
- "qual meu saldo?"
- "extrato do mês"
- "quanto gastei hoje?"

## 🏗️ Arquitetura Técnica

### Fluxo de Mensagens

1. **Usuário envia mensagem** → WhatsApp
2. **WhatsApp** → Webhook `/webhook/whatsapp` (POST)
3. **Sistema processa** → Regex + AI para interpretar comando
4. **Ação executada** → Registra transação ou consulta dados
5. **Resposta enviada** → WhatsApp API → Usuário

### Componentes Implementados

- `server/whatsapp.ts` - Lógica principal de integração
- `client/src/components/whatsapp-integration.tsx` - Interface para vincular números
- Webhook routes em `server/routes.ts`
- Processamento inteligente em `server/ai.ts`

## 🔒 Segurança

- Validação de tokens de verificação
- Autenticação via access tokens
- Validação de formato de números de telefone
- Rate limiting automático via Meta

## ⚠️ Limitações Atuais

1. **Ambiente de Desenvolvimento**: Apenas números verificados podem receber mensagens
2. **Produção**: Necessário aprovação da Meta para envio em massa
3. **Rate Limits**: Meta impõe limites de mensagens por hora

## 🚀 Próximos Passos

1. Configure as variáveis de ambiente
2. Teste em ambiente de desenvolvimento
3. Para produção: solicite aprovação da Meta Business Verification
4. Configure domínio personalizado (opcional)

## 📞 Suporte

Em caso de problemas:
1. Verifique logs do webhook no console do Replit
2. Confirme variáveis de ambiente
3. Teste conectividade com Meta Developer Console
4. Verifique status do número business no WhatsApp Manager

---

**Nota**: Esta integração usa a WhatsApp Cloud API oficial da Meta, garantindo estabilidade e conformidade com os termos de serviço.