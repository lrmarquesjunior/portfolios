# Descrição Técnica — Connect + Lambda + DynamoDB

## Problema

Atendimento genérico sem personalização. O agente não sabe quem está ligando antes de atender, gerando perda de tempo e experiência ruim para o cliente.

## Solução

Ao receber a chamada, o Connect invoca uma Lambda que consulta o DynamoDB pelo número de telefone e retorna os dados do cliente. O fluxo usa esses dados para personalizar a saudação e o roteamento.

## Decisões de Arquitetura

- **DynamoDB** escolhido pela latência baixa (< 10ms) — essencial para não impactar o tempo de atendimento
- Lambda com timeout de **3 segundos** — Connect tem limite de 8s para resposta da Lambda
- Todos os valores retornados pela Lambda são **strings** — Connect não aceita outros tipos nos atributos de contato
- Tratamento de erro com fallback para atendimento genérico quando cliente não é encontrado

## Estrutura da Tabela DynamoDB

| Atributo | Tipo | Descrição |
|---|---|---|
| `telefone` | String (PK) | Número no formato E.164 (+5511...) |
| `nome` | String | Nome completo do cliente |
| `contrato` | String | Número do contrato |
| `status` | String | ativo / inativo / suspenso |
| `plano` | String | Nome do plano contratado |

## Lições Aprendidas

> _Preencher após conclusão do projeto_
