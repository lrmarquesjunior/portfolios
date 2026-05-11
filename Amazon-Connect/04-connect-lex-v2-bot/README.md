# 04 — Amazon Connect + Lex V2 Bot

## 📋 Visão Geral

Bot conversacional avançado com Amazon Lex V2 integrado ao Connect. Diferente do Lex V1, o Lex V2 permite conversas multi-turno, slots com validação customizada via Lambda e experiência mais natural para o cliente.

---

## 🏗️ Arquitetura

> _Adicionar `diagrama-arquitetura.png` aqui_

**Fluxo de Atendimento:**
```
Cliente liga
     ↓
Amazon Connect (Contact Flow)
     ↓
Amazon Lex V2 (bot multi-turno)
     ├── Coleta intenção
     ├── Coleta slots (dados necessários)
     └── Valida via Lambda (fulfillment)
          ↓
     Retorna resultado para o Connect
          ↓
     Roteamento ou resposta ao cliente
```

---

## 🛠️ Serviços AWS Utilizados

| Serviço | Função |
|---|---|
| Amazon Connect | Plataforma de contact center |
| Amazon Lex V2 | Bot conversacional multi-turno |
| AWS Lambda | Validação de slots e fulfillment |
| Amazon DynamoDB | Persistência de dados coletados |

---

## 📁 Estrutura de Arquivos

```
04-connect-lex-v2-bot/
├── README.md
├── diagrama-arquitetura.png
├── lex-bot/
│   └── bot-definition.json        ← exportado do Lex V2
├── contact-flows/
│   └── fluxo-com-lex-v2.json
├── lambda/
│   └── lex-fulfillment/
│       ├── index.js
│       └── README.md
└── docs/
    └── descricao.md
```

---

## 🔑 Conceitos Demonstrados

- Criação de Bot no Lex V2 com intents e slots
- Integração Lex V2 com Amazon Connect (diferenças do V1)
- Lambda como **fulfillment hook** do Lex V2
- Conversas multi-turno com contexto
- Exportação e versionamento do bot

---

## 📝 Status

📋 Planejado
