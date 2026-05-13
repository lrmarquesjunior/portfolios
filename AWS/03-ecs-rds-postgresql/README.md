# 03 — ECS (Fargate) + RDS PostgreSQL

## 📋 Visão Geral

Aplicação containerizada rodando no Amazon ECS Fargate com banco de dados PostgreSQL gerenciado pelo Amazon RDS. A arquitetura segue boas práticas de segurança: o container roda em subnet privada, o RDS não tem acesso público, e as credenciais do banco são gerenciadas pelo AWS Secrets Manager.

---

## 🏗️ Arquitetura

> _Adicionar `diagrama-arquitetura.png` aqui_

```
Internet
   ↓
Application Load Balancer (subnet pública)
   ↓
ECS Service — Fargate (subnet privada)
   ↓                    ↓
RDS PostgreSQL     Secrets Manager
(subnet privada,   (credenciais do banco)
 Multi-AZ)
```

---

## 🛠️ Serviços AWS Utilizados

| Serviço | Função |
|---|---|
| Amazon ECS (Fargate) | Orquestração do container sem gerenciar servidores |
| Amazon ECR | Registry da imagem Docker |
| Amazon RDS (PostgreSQL) | Banco de dados relacional gerenciado |
| AWS Secrets Manager | Credenciais do banco (usuário/senha) |
| Application Load Balancer | Entrada de tráfego externo |
| Amazon VPC | Isolamento de rede (subnets públicas e privadas) |
| AWS IAM | Roles e policies para o ECS Task |
| Amazon CloudWatch | Logs do container e métricas do RDS |

---

## 📁 Estrutura de Arquivos

```
03-ecs-rds-postgresql/
├── README.md
├── diagrama-arquitetura.png
├── docker/
│   └── Dockerfile
├── configs/
│   └── task-definition.json
└── docs/
    └── descricao.md
```

---

## 🔑 Conceitos Demonstrados

- ECS Task com **IAM Role** para acesso ao Secrets Manager (sem credenciais hardcoded)
- RDS PostgreSQL em **subnet privada** sem IP público
- **Security Groups** com least privilege: ALB → ECS → RDS (cada camada só fala com a próxima)
- **Multi-AZ** no RDS para alta disponibilidade
- Secrets Manager com credenciais do banco injetadas no container
- **CloudWatch Logs** para o container via awslogs driver
- Health check no ALB apontando para endpoint `/health` da aplicação

---

## 🔐 Segurança

| Camada | Configuração |
|---|---|
| ALB | Security Group: aceita 443 (HTTPS) da internet |
| ECS Task | Security Group: aceita apenas do ALB na porta da aplicação |
| RDS | Security Group: aceita apenas do ECS na porta 5432 |
| Credenciais | Secrets Manager — nunca em variáveis de ambiente em texto plano |
| IAM | Task Role com permissão mínima: só `secretsmanager:GetSecretValue` |

---

## 📝 Status

🔄 Em andamento
