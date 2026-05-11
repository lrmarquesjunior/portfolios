# 01 — Amazon Connect Básico + Lex

## 📋 Visão Geral

Implementação de um contact center básico com Amazon Connect integrado ao Amazon Lex para reconhecimento de intenções via voz/texto. O fluxo direciona o cliente para filas de atendimento com base na intenção identificada pelo bot.

---

## 🏗️ Arquitetura

> _Adicionar `diagrama-arquitetura.png` aqui_

**Fluxo de Atendimento:**
```
Cliente liga
     ↓
Amazon Connect (Contact Flow)
     ↓
Amazon Lex (identifica intenção)
     ↓
┌────────────────────────────┐
│  Intenção: Suporte         │ → Fila: Suporte Técnico
│  Intenção: Financeiro      │ → Fila: Financeiro
│  Intenção: Não reconhecida │ → Fila: Geral
└────────────────────────────┘
```

---

## 🛠️ Serviços AWS Utilizados

| Serviço | Função |
|---|---|
| Amazon Connect | Plataforma de contact center, gerencia o fluxo de chamadas |
| Amazon Lex | Bot para reconhecimento de intenções (NLU) |
| Amazon Polly | Text-to-Speech para mensagens ao cliente |

---

## 📁 Estrutura de Arquivos

```
01-connect-basico-lex/
├── README.md
├── diagrama-arquitetura.png
├── contact-flows/
│   └── fluxo-principal.json       ← exportado do Connect
└── docs/
    └── descricao.md
```

---

## 🔑 Conceitos Demonstrados

- Criação de instância Amazon Connect
- Configuração de Contact Flow com blocos básicos
- Integração com Amazon Lex (Get Customer Input)
- Configuração de Queues e Routing Profiles
- Horários de funcionamento (Hours of Operation)

---

## 📝 Status

✅ Concluído
