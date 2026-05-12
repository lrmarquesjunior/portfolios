# Route 53 — Configuração do Registro MX

## O que é o registro MX?

O registro MX (Mail Exchanger) diz para onde os e-mails enviados ao seu domínio devem ser entregues. Neste projeto, apontamos para o Amazon SES para que ele receba os e-mails.

## Endpoint SES por região

| Região | Endpoint MX |
|---|---|
| us-east-1 (N. Virginia) | `inbound-smtp.us-east-1.amazonaws.com` |
| us-west-2 (Oregon) | `inbound-smtp.us-west-2.amazonaws.com` |
| eu-west-1 (Irlanda) | `inbound-smtp.eu-west-1.amazonaws.com` |

## Configuração no Route 53

### Via Console

1. Acesse **Route 53 → Hosted Zones → sua zona**
2. Crie um novo record:
   - **Record name:** `@` (ou deixe em branco para o domínio raiz)
   - **Record type:** `MX`
   - **Value:** `10 inbound-smtp.us-east-1.amazonaws.com`
   - **TTL:** 300

### Via AWS CLI

```bash
aws route53 change-resource-record-sets \
  --hosted-zone-id ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "empresa.com",
        "Type": "MX",
        "TTL": 300,
        "ResourceRecords": [{
          "Value": "10 inbound-smtp.us-east-1.amazonaws.com"
        }]
      }
    }]
  }'
```

## Verificação do domínio no SES

Antes de receber e-mails, o domínio precisa ser verificado no SES:

```bash
aws ses verify-domain-identity --domain empresa.com
```

O comando retorna um token que deve ser adicionado como registro TXT no Route 53:
- **Record type:** `TXT`
- **Name:** `_amazonses.empresa.com`
- **Value:** `"token-retornado-pelo-ses"`
