# 02 — Amazon Connect + Lambda + DynamoDB

## 📋 Visão Geral

Integração do Amazon Connect com AWS Lambda e DynamoDB para consulta de dados do cliente em tempo real durante o atendimento. O fluxo identifica o cliente pelo número de telefone e personaliza o atendimento com base nos dados retornados.

---

## 🏗️ Arquitetura

> _Adicionar `diagrama-arquitetura.png` aqui_

**Fluxo de Atendimento:**
```
Cliente liga (número identificado pelo Connect)
     ↓
Amazon Connect (Contact Flow)
     ↓
Invoke AWS Lambda (passa número do cliente)
     ↓
Lambda consulta DynamoDB (busca por telefone)
     ↓
Retorna dados: nome, contrato, status
     ↓
Connect usa atributos para personalizar atendimento
     ↓
"Olá João, seu contrato está ativo. Como posso ajudar?"
```

---

## 🛠️ Serviços AWS Utilizados

| Serviço | Função |
|---|---|
| Amazon Connect | Plataforma de contact center |
| AWS Lambda | Lógica de consulta e transformação de dados |
| Amazon DynamoDB | Banco de dados de clientes |
| Amazon Lex | Reconhecimento de intenções (opcional) |

---

## 📁 Estrutura de Arquivos

```
02-connect-lambda-dynamodb/
├── README.md
├── diagrama-arquitetura.png
├── contact-flows/
│   └── fluxo-consulta-cliente.json
├── lambda/
│   └── consulta-cliente/
│       ├── index.js
│       ├── package.json
│       └── README.md
└── docs/
    └── descricao.md
```

---

## 🔑 Conceitos Demonstrados

- Bloco **Invoke AWS Lambda** dentro do Contact Flow
- Passagem de atributos do Connect para Lambda (`$.Attributes`, `$.CustomerEndpoint`)
- Retorno de dados da Lambda para o fluxo via response attributes
- Uso de **Set Contact Attributes** para armazenar dados do cliente
- Consulta ao DynamoDB com `GetItem` por chave primária
- Tratamento de erros: cliente não encontrado, timeout Lambda

---

## 📝 Status

🔄 Em andamento
