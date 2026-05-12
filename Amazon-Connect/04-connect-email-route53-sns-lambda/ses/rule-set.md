# SES Rule Set — Configuração de Recepção de E-mails

## Pré-requisitos

1. Domínio verificado no Amazon SES
2. Registro MX no Route 53 apontando para o SES (ver `configs/route53-mx-record.md`)
3. SES fora do sandbox (solicitar saída do sandbox para receber e-mails de qualquer remetente)

## Criação do Rule Set

### Via Console AWS

1. Acesse **Amazon SES → Email receiving → Rule sets**
2. Crie um novo Rule Set (ou use o default)
3. Adicione uma Rule com:
   - **Recipients:** `suporte@empresa.com` (ou `@empresa.com` para qualquer endereço do domínio)
   - **Actions (em ordem):**
     1. **S3** — salva o e-mail completo para auditoria
        - Bucket: `emails-recebidos-empresa`
        - Prefix: `incoming/`
     2. **SNS** — publica notificação
        - Topic: `arn:aws:sns:REGION:ACCOUNT:email-recebido`
        - Encoding: UTF-8

### Via AWS CLI

```bash
aws ses create-receipt-rule \
  --rule-set-name default-rule-set \
  --rule '{
    "Name": "receber-emails-suporte",
    "Enabled": true,
    "Recipients": ["suporte@empresa.com"],
    "Actions": [
      {
        "S3Action": {
          "BucketName": "emails-recebidos-empresa",
          "ObjectKeyPrefix": "incoming/"
        }
      },
      {
        "SNSAction": {
          "TopicArn": "arn:aws:sns:us-east-1:ACCOUNT:email-recebido",
          "Encoding": "UTF-8"
        }
      }
    ],
    "ScanEnabled": true
  }'
```

## Assinatura SNS → Lambda

Após criar o tópico SNS, adicione a Lambda como subscriber:

```bash
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT:email-recebido \
  --protocol lambda \
  --notification-endpoint arn:aws:lambda:us-east-1:ACCOUNT:function:processar-email
```

Lembre de adicionar a permissão para o SNS invocar a Lambda:

```bash
aws lambda add-permission \
  --function-name processar-email \
  --statement-id sns-invoke \
  --action lambda:InvokeFunction \
  --principal sns.amazonaws.com \
  --source-arn arn:aws:sns:us-east-1:ACCOUNT:email-recebido
```
