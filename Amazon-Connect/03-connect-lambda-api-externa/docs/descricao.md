# Descrição Técnica — Connect + Lambda + API Externa

## Problema

Dados do cliente estão em um sistema externo (CRM/ERP) que não tem integração nativa com AWS. É necessário consultar esse sistema durante o atendimento sem expor credenciais no código.

## Solução

Lambda atua como proxy seguro: busca as credenciais no Secrets Manager em tempo de execução e faz a chamada HTTP para a API externa, retornando os dados formatados para o Connect.

## Decisões de Arquitetura

- **Secrets Manager** para credenciais — nunca hardcoded no código ou variáveis de ambiente em texto plano
- **Timeout de 5s** na chamada HTTP — Lambda tem timeout de 8s configurado, deixando margem para o Connect
- **Fallback gracioso** — se a API externa falhar, o atendimento continua sem dados personalizados em vez de travar
- **Logs estruturados** no CloudWatch para facilitar troubleshooting em produção

## Lições Aprendidas

> _Preencher após conclusão do projeto_
