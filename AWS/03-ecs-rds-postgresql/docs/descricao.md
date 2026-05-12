# Descrição Técnica — ECS Fargate + RDS PostgreSQL

## Problema

Aplicação containerizada precisa de banco de dados relacional com alta disponibilidade, sem expor credenciais no código e sem gerenciar servidores de banco de dados.

## Solução

ECS Fargate (sem gerenciar EC2) + RDS PostgreSQL gerenciado com credenciais no Secrets Manager. Toda a infraestrutura provisionada via Terraform.

## Decisões de Arquitetura

**Rede:**
- ALB em subnet pública — único ponto de entrada externo
- ECS e RDS em subnets privadas — sem IP público, sem acesso direto da internet
- Security Groups em camadas: internet → ALB → ECS → RDS

**Credenciais:**
- `manage_master_user_password = true` no Terraform — a AWS cria e gerencia o secret automaticamente no Secrets Manager
- Container recebe o ARN do secret via variável de ambiente `DB_SECRET`
- Aplicação lê o secret em runtime — nunca em texto plano

**Alta Disponibilidade:**
- `multi_az = true` em produção — RDS com réplica síncrona em outra AZ
- ECS Service com `desired_count >= 2` em produção — tasks em AZs diferentes

**Observabilidade:**
- Container Insights habilitado no cluster ECS
- Logs do container no CloudWatch com retenção de 30 dias
- Health check no ALB e no container

## Comandos para deploy manual

```bash
# Build e push da imagem para o ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ACCOUNT.dkr.ecr.us-east-1.amazonaws.com
docker build -t minha-app .
docker tag minha-app:latest ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/minha-app:latest
docker push ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/minha-app:latest

# Forçar novo deploy no ECS após push da imagem
aws ecs update-service --cluster CLUSTER_NAME --service SERVICE_NAME --force-new-deployment
```

> 💡 Provisionamento via Terraform será abordado no próximo projeto (04 — ECS + RDS + Terraform).

## Lições Aprendidas

> _Preencher após conclusão do projeto_
