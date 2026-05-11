# Lambda — Integração API Externa

## Descrição

Função Lambda que serve como intermediário entre o Amazon Connect e uma API REST externa. Busca credenciais no Secrets Manager e faz a chamada HTTP de forma segura.

## Variáveis de Ambiente

| Variável | Descrição | Exemplo |
|---|---|---|
| `API_BASE_URL` | URL base da API externa | `https://api.empresa.com/v1` |
| `SECRET_NAME` | Nome do secret no Secrets Manager | `connect/api-externa/credenciais` |
| `REGION` | Região AWS | `us-east-1` |

## Permissões IAM necessárias (Role da Lambda)

```json
{
  "Effect": "Allow",
  "Action": ["secretsmanager:GetSecretValue"],
  "Resource": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:connect/api-externa/*"
}
```

## Formato do Secret no Secrets Manager

```json
{
  "api_token": "seu-token-aqui"
}
```
