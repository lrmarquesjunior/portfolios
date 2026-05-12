# Lambda — Consulta Cliente + Lex

## Descrição

Lambda invocada pelo Amazon Connect após o Lex identificar a intenção do cliente. Consulta o DynamoDB pelo número de telefone e retorna os dados do cliente junto com a intenção identificada, para que o Contact Flow possa tomar decisões de roteamento e personalização.

## Parâmetros recebidos do Connect

O Contact Flow deve passar a intenção via **Set Contact Attributes** antes de invocar a Lambda:

| Parâmetro | Origem | Descrição |
|---|---|---|
| `CustomerEndpoint.Address` | Automático | Número de telefone do cliente |
| `Parameters.intencao` | Set Contact Attributes | Intenção identificada pelo Lex |

## Output retornado para o Connect

```json
{
  "encontrado": "true",
  "intencao": "ConsultarSaldo",
  "nome": "João Silva",
  "contrato": "CTR-00123",
  "status": "ativo",
  "saldo": "150.00",
  "plano": "Premium"
}
```

## Variáveis de Ambiente

| Variável | Descrição | Padrão |
|---|---|---|
| `DYNAMODB_TABLE` | Nome da tabela DynamoDB | `clientes` |
| `REGION` | Região AWS | `us-east-1` |

## Estrutura da Tabela DynamoDB

| Atributo | Tipo | Descrição |
|---|---|---|
| `telefone` | String (PK) | Número no formato E.164 (+5511...) |
| `nome` | String | Nome completo |
| `contrato` | String | Número do contrato |
| `status` | String | ativo / inativo / suspenso |
| `saldo` | String | Saldo atual |
| `plano` | String | Plano contratado |
