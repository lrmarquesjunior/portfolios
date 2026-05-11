# 02 — ECS + ECR + Spring Boot (InvestControl)

## 📋 Visão Geral

Aplicação Spring Boot containerizada com Docker, publicada no Amazon ECR e orquestrada via Amazon ECS com Fargate.

---

## 🏗️ Arquitetura

> _Diagrama em construção — adicionar `diagrama-arquitetura.png` aqui_

**Fluxo:**
```
Desenvolvedor → Docker Build → ECR (push image)
                                    ↓
                             ECS Task Definition
                                    ↓
                          ECS Service (Fargate)
                                    ↓
                         Application Load Balancer
                                    ↓
                               Usuário Final
```

---

## 🛠️ Serviços AWS Utilizados

| Serviço | Função |
|---|---|
| Amazon ECR | Registry para imagem Docker |
| Amazon ECS (Fargate) | Orquestração de containers serverless |
| Task Definition | Configuração do container (CPU, memória, porta) |
| Application Load Balancer | Distribuição de tráfego |

---

## 📦 Stack da Aplicação

- **Backend:** Java + Spring Boot
- **Container:** Docker
- **Registry:** Amazon ECR
- **Orquestração:** Amazon ECS Fargate

---

## 📁 Estrutura de Arquivos

```
02-ecs-ecr-spring-boot/
├── README.md
├── diagrama-arquitetura.png
├── docs/
│   └── descricao.md
└── configs/
    └── task-definition.json
```

---

## 📝 Status

🔄 Em andamento
