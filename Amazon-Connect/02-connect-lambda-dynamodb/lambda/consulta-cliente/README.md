# Lambda — Consulta Cliente

## Descrição

Função Lambda invocada pelo Amazon Connect para buscar dados do cliente no DynamoDB com base no número de telefone.

## Input (enviado pelo Connect)

```json
{
  "Details": {
    "ContactData": {
      "CustomerEndpoint": {
        "Address": "+5511999999999",
        "Type": "TELEPHONE_NUMBER"
      },
      "Attributes": {}
    },
    "Parameters": {}
  },
  "Name": "ContactFlowEvent"
}
```

## Output (retornado para o Connect)

```json
{
  "nome": "João Silva",
  "contrato": "CTR-00123",
  "status": "ativo",
  "plano": "Premium",
  "encontrado": "true"
}
```

## Variáveis de Ambiente

| Variável | Descrição |
|---|---|
| `DYNAMODB_TABLE` | Nome da tabela DynamoDB |
| `REGION` | Região AWS |
