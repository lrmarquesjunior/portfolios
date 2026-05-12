# 04 — Amazon Connect + E-mail + Customer Profiles
### Route 53 → SES → SNS → Lambda → DynamoDB → Customer Profiles → Task

## 📋 Visão Geral

Pipeline completo de recepção de e-mail integrado ao Amazon Connect com enriquecimento de dados via **Customer Profiles**.

Quando um cliente envia um e-mail, o fluxo:
1. Recebe o e-mail via SES (domínio gerenciado pelo Route 53)
2. Invoca uma Lambda que busca o cliente no DynamoDB pelo e-mail remetente
3. Retorna o `profileId` do Customer Profiles + dados do cliente + chamados em aberto
4. Cria uma **Task no Connect** já associada ao perfil do cliente
5. O agente recebe o contato com nome, histórico e chamados visíveis no CCP

---

## 🏗️ Arquitetura

> _Adicionar `diagrama-arquitetura.png` aqui_

```
Cliente envia e-mail para suporte@empresa.com
          ↓
Route 53 (MX Record → SES)
          ↓
Amazon SES (recebe e-mail)
          ↓
SES Rule Set:
  ├── S3 (salva e-mail completo para auditoria)
  └── SNS Topic (notifica)
          ↓
SNS → invoca Lambda
          ↓
Lambda "processar-email":
  ├── Extrai: remetente, assunto, corpo
  ├── DynamoDB tabela "clientes"   → busca por email → retorna profileId + dados
  └── DynamoDB tabela "chamados"   → busca chamados em aberto do cliente
          ↓
Lambda cria Task no Amazon Connect:
  ├── Associa CustomerProfileId  → Connect vincula ao Customer Profile
  ├── Atributos: nome, contrato, assunto, chamados em aberto
  └── Roteamento para fila correta (ex: suporte, financeiro)
          ↓
Amazon Connect — Customer Profile atualizado automaticamente
          ↓
Agente recebe Task no CCP com:
  ├── Nome e dados do cliente
  ├── Histórico de contatos anteriores
  └── Chamados em aberto
```

---

## 🛠️ Serviços AWS Utilizados

| Serviço | Função |
|---|---|
| Amazon Route 53 | Domínio e registro MX apontando para SES |
| Amazon SES | Recepção de e-mails |
| Amazon SNS | Desacopla SES da Lambda (event-driven) |
| AWS Lambda | Orquestra todo o fluxo: busca + criação da Task |
| Amazon DynamoDB | Tabela `clientes` (lookup por e-mail) e `chamados` (histórico) |
| Amazon Connect | Plataforma de atendimento — recebe a Task |
| Amazon Connect Customer Profiles | Perfil unificado do cliente com histórico de contatos |
| Amazon S3 | Armazenamento do e-mail completo para auditoria |
| Amazon CloudWatch | Logs e monitoramento da Lambda |

---

## 🗄️ Modelo de Dados DynamoDB

### Tabela: `clientes`
| Atributo | Tipo | Descrição |
|---|---|---|
| `email` | String **(PK)** | E-mail do cliente (chave de busca) |
| `profileId` | String | ID do perfil no Connect Customer Profiles |
| `nome` | String | Nome completo |
| `contrato` | String | Número do contrato |
| `status` | String | ativo / inativo / suspenso |
| `telefone` | String | Telefone (E.164) |
| `fila` | String | Fila padrão de atendimento do cliente |

### Tabela: `chamados`
| Atributo | Tipo | Descrição |
|---|---|---|
| `clienteEmail` | String **(PK)** | E-mail do cliente |
| `chamadoId` | String **(SK)** | ID único do chamado |
| `titulo` | String | Título/assunto do chamado |
| `status` | String | aberto / em_andamento / fechado |
| `criadoEm` | String | Data de criação (ISO 8601) |
| `atualizadoEm` | String | Última atualização |

---

## 📁 Estrutura de Arquivos

```
04-connect-email-route53-sns-lambda/
├── README.md
├── diagrama-arquitetura.png
├── lambda/
│   └── processar-email/
│       ├── index.js              ← orquestrador principal
│       ├── dynamo.js             ← consultas DynamoDB (clientes + chamados)
│       ├── connect.js            ← criação da Task + associação Customer Profile
│       ├── package.json
│       └── README.md
├── ses/
│   └── rule-set.md
├── configs/
│   └── route53-mx-record.md
└── docs/
    └── descricao.md
```

---

## 🔑 Conceitos Demonstrados

- Configuração de **domínio de e-mail no Route 53** (registro MX)
- **SES Rule Set** com ações encadeadas (S3 + SNS)
- Integração **SES → SNS → Lambda** (event-driven)
- Lookup de cliente no **DynamoDB** por e-mail
- Consulta de **chamados em aberto** em tabela separada
- Criação de **Task no Connect** com `CustomerProfileId` via `StartTaskContact`
- **Customer Profiles** atualizado automaticamente ao associar o contato
- Agente recebe contato com histórico completo no **CCP (Contact Control Panel)**

---

## 📝 Status

🔄 Em andamento
