# 03 — Amazon Connect + Lambda + API Externa

## 📋 Visão Geral

Integração do Amazon Connect com uma API REST externa via AWS Lambda. Durante o atendimento, o fluxo consulta um serviço externo (ex: sistema de CRM, ERP, ou API de parceiro) para obter informações em tempo real.

---

## 🏗️ Arquitetura

> _Adicionar `diagrama-arquitetura.png` aqui_

**Fluxo de Atendimento:**
```
Cliente liga
     ↓
Amazon Connect (Contact Flow)
     ↓
Invoke AWS Lambda
     ↓
Lambda faz HTTP request → API Externa (CRM / ERP / Parceiro)
     ↓
Retorna dados para o Connect
     ↓
Fluxo usa dados para personalizar atendimento ou tomar decisão
```

---

## 🛠️ Serviços AWS Utilizados

| Serviço | Função |
|---|---|
| Amazon Connect | Plataforma de contact center |
| AWS Lambda | Intermediário entre Connect e API externa |
| AWS Secrets Manager | Armazenamento seguro de credenciais da API |
| Amazon CloudWatch | Logs e monitoramento da Lambda |

---

## 📁 Estrutura de Arquivos

```
03-connect-lambda-api-externa/
├── README.md
├── diagrama-arquitetura.png
├── contact-flows/
│   └── fluxo-consulta-api.json
├── lambda/
│   └── integracao-api-externa/
│       ├── index.js
│       ├── package.json
│       └── README.md
└── docs/
    └── descricao.md
```

---

## 🔑 Conceitos Demonstrados

- Chamada HTTP a API externa dentro de Lambda
- Uso do **AWS Secrets Manager** para não expor credenciais no código
- Tratamento de timeout e retry para APIs externas
- Mapeamento de resposta da API para atributos do Connect
- Logs estruturados no CloudWatch para rastreabilidade

---

## 📝 Status

📋 Planejado
