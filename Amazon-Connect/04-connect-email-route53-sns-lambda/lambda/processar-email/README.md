# Lambda — Processar E-mail

## Arquivos

| Arquivo | Responsabilidade |
|---|---|
| `index.js` | Handler principal — orquestra o fluxo completo |
| `dynamo.js` | Consultas DynamoDB: busca cliente e chamados em aberto |
| `connect.js` | Criação da Task no Connect com Customer Profile associado |

## Variáveis de Ambiente

| Variável | Descrição | Exemplo |
|---|---|---|
| `CONNECT_INSTANCE_ID` | ID da instância do Amazon Connect | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `CONNECT_FLOW_ID` | ID do Contact Flow para Tasks | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `CONNECT_QUEUE_ID` | Fila padrão (fallback quando cliente não tem fila definida) | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `DYNAMODB_TABLE_CLIENTES` | Tabela de clientes | `clientes` |
| `DYNAMODB_TABLE_CHAMADOS` | Tabela de chamados | `chamados` |
| `REGION` | Região AWS | `us-east-1` |

## Permissões IAM (Role da Lambda)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["dynamodb:GetItem", "dynamodb:Query"],
      "Resource": [
        "arn:aws:dynamodb:REGION:ACCOUNT:table/clientes",
        "arn:aws:dynamodb:REGION:ACCOUNT:table/chamados"
      ]
    },
    {
      "Effect": "Allow",
      "Action": ["connect:StartTaskContact"],
      "Resource": "arn:aws:connect:REGION:ACCOUNT:instance/INSTANCE_ID/*"
    }
  ]
}
```

## Como o Customer Profile é associado

O Connect associa automaticamente o contato ao Customer Profile quando o `profileId` é passado como atributo de contato na Task. O Contact Flow deve ter o bloco **"Update contact attributes"** configurado para mapear o atributo `profileId` para o campo `CustomerProfileId` do Connect.

No Contact Flow, após receber a Task:
```
Set contact attributes:
  CustomerProfileId = $.Attributes.profileId
```

Isso faz o Customer Profile aparecer automaticamente no CCP para o agente.

## Comportamento quando cliente não é encontrado

- `profileId` retorna vazio → Connect não associa perfil → agente atende sem dados
- `filaId` retorna vazio → Task vai para a fila padrão definida em `CONNECT_QUEUE_ID`
- `chamadosAbertos` retorna `[]` → atributo `resumoChamados` = "Nenhum chamado em aberto"
- O fluxo **nunca trava** — sempre cria a Task, com ou sem dados do cliente
