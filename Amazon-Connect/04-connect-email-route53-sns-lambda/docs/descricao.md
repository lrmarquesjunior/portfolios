# Descrição Técnica — Connect + E-mail + Customer Profiles

## Problema

Clientes enviam e-mails para suporte, mas:
- Os e-mails chegam em caixa separada do Connect (Outlook/Gmail)
- O agente não sabe quem é o cliente antes de abrir o e-mail
- Não há visibilidade de chamados em aberto do mesmo cliente
- Não existe fila, SLA ou roteamento inteligente para e-mails

## Solução

Pipeline event-driven que recebe o e-mail, enriquece com dados do cliente e entrega ao agente como uma Task no Connect — com Customer Profile já associado, histórico visível e chamados em aberto listados.

## Fluxo Detalhado

```
1. Cliente envia e-mail para suporte@empresa.com
2. Route 53 (MX) → SES recebe
3. SES Rule Set:
   a. Salva e-mail completo no S3 (auditoria)
   b. Publica no SNS
4. SNS invoca Lambda
5. Lambda:
   a. Extrai remetente + assunto do payload SES
   b. GetItem no DynamoDB "clientes" (PK: email) → profileId + dados
   c. Query no DynamoDB "chamados" (PK: email, filter: status IN aberto/em_andamento)
   d. StartTaskContact no Connect:
      - QueueId: fila do cliente (ou padrão)
      - Attributes: nome, contrato, profileId, chamados em aberto
6. Connect recebe Task
7. Contact Flow associa CustomerProfileId → Customer Profile vinculado
8. Task entra na fila → agente recebe no CCP com dados completos
```

## Decisões de Arquitetura

**Por que duas tabelas DynamoDB?**
- `clientes` com PK `email` — GetItem O(1), leitura pontual por remetente
- `chamados` com PK `clienteEmail` + SK `chamadoId` — Query eficiente por cliente, permite múltiplos chamados por cliente sem scan

**Por que SNS entre SES e Lambda?**
- Desacoplamento: permite adicionar outros subscribers no futuro (ex: notificar sistema de tickets, enviar confirmação ao cliente) sem alterar a Lambda
- Retry automático: SNS tenta reentrega em caso de falha da Lambda

**Por que não usar o canal de e-mail nativo do Connect?**
- O canal de e-mail nativo do Connect (Amazon Connect Email) ainda tem disponibilidade limitada por região
- Esta arquitetura funciona em qualquer região onde SES está disponível para recepção

**Fallback gracioso**
- Cliente não encontrado no DynamoDB → Task criada sem profileId → agente atende sem dados pré-carregados
- Erro no DynamoDB → Task criada com dados mínimos → nunca bloqueia o atendimento

## Customer Profiles — Como funciona a associação

O `profileId` retornado pelo DynamoDB é o ID do perfil já existente no Connect Customer Profiles. A Lambda passa esse ID como atributo de contato (`profileId`) na Task.

No Contact Flow, o bloco **"Update contact attributes"** mapeia:
```
CustomerProfileId ← $.Attributes.profileId
```

A partir desse momento, o Connect vincula o contato ao perfil e o agente vê no CCP:
- Nome e dados do cliente
- Histórico de contatos anteriores (chamadas, chats, e-mails anteriores)
- Atributos customizados do perfil

## Lições Aprendidas

> _Preencher após conclusão do projeto_
