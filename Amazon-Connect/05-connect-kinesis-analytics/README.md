# 05 — Amazon Connect + Kinesis + Analytics

## 📋 Visão Geral

Pipeline de dados para análise de atendimentos em tempo real e histórico. O Amazon Connect envia eventos de contato para o Kinesis Data Streams, que alimenta um data lake no S3 para consultas com Athena.

---

## 🏗️ Arquitetura

> _Adicionar `diagrama-arquitetura.png` aqui_

**Fluxo de Dados:**
```
Amazon Connect
  ├── Contact Trace Records (CTR)  → Kinesis Data Streams → S3 → Athena
  └── Agent Events                 → Kinesis Data Streams → S3 → Athena
                                                               ↓
                                                    Amazon QuickSight (dashboard)
```

---

## 🛠️ Serviços AWS Utilizados

| Serviço | Função |
|---|---|
| Amazon Connect | Fonte dos dados de atendimento |
| Amazon Kinesis Data Streams | Streaming de CTRs e eventos de agente |
| Amazon Kinesis Data Firehose | Entrega dos dados no S3 |
| Amazon S3 | Data lake com dados de atendimento |
| AWS Glue | Catálogo de dados e ETL |
| Amazon Athena | Consultas SQL sobre os dados no S3 |
| Amazon QuickSight | Dashboards e visualizações (opcional) |

---

## 📁 Estrutura de Arquivos

```
05-connect-kinesis-analytics/
├── README.md
├── diagrama-arquitetura.png
├── queries/
│   ├── tempo-medio-atendimento.sql
│   ├── volume-por-fila.sql
│   └── taxa-abandono.sql
├── glue/
│   └── schema-ctr.json
└── docs/
    └── descricao.md
```

---

## 🔑 Conceitos Demonstrados

- Configuração de **Data Streaming** no Amazon Connect
- Kinesis Data Streams + Firehose para ingestão contínua
- Particionamento de dados no S3 por data
- Glue Crawler para catalogação automática
- Queries Athena para métricas de contact center
- Métricas: AHT, FCR, taxa de abandono, volume por fila

---

## 📝 Status

📋 Planejado
