# connect-lambda-dynamodb-chat Bugfix Design

## Overview

O fluxo Amazon Connect para chat/email possui dois bugs que impedem a consulta de chamados no DynamoDB:

1. **Bug principal (Contact Flow)**: O bloco `UpdateContactAttributes` lê `$.StoredCustomerInput` — referência DTMF/voz — em vez de `$.Text`, que é o campo correto para entrada de texto capturada pelo bloco `GetParticipantInput` com `InputType: "Text"`. Resultado: `numeroChamado` fica vazio.

2. **Bug secundário (Lambda)**: A função usa `get_item` com chave composta `{'idChamado': X, 'id_Chamado': X}`, assumindo que ambas as chaves têm o mesmo valor. Na tabela real, `id_Chamado` é um contador independente (ex: "1", "2", "3"), diferente do `idChamado` (ex: "2001"). Resultado: `get_item` nunca encontra o item.

A estratégia de correção é mínima e cirúrgica: corrigir a referência de atributo no Contact Flow e substituir `get_item` por `query` usando apenas o partition key `idChamado`.


## Glossary

- **Bug_Condition (C)**: Condição que ativa o bug — entrada de texto em chat/email onde `$.StoredCustomerInput` retorna vazio e/ou `get_item` com sort key incorreto falha
- **Property (P)**: Comportamento correto esperado — `numeroChamado` populado corretamente e item DynamoDB encontrado via `query` no partition key
- **Preservation**: Comportamentos existentes que não devem ser alterados — tratamento de chamado não encontrado, timeout, erros genéricos, mensagem de encerramento
- **GetParticipantInput**: Bloco do Amazon Connect (`Type: "GetParticipantInput"`) que captura texto livre em chat/email; a resposta do cliente fica em `$.Text`
- **StoredCustomerInput**: Referência legada para entrada DTMF (voz); **não funciona** em chat/email
- **idChamado**: Partition key da tabela `t_chamado` — valor ex: "2001", "2002"
- **id_Chamado**: Sort key da tabela `t_chamado` — valor ex: "1", "2", "3" (independente do partition key)
- **query**: Operação DynamoDB que busca por partition key com `KeyConditionExpression`; retorna lista de itens
- **get_item**: Operação DynamoDB que exige chave composta exata (partition + sort key); inadequada quando o sort key é desconhecido


## Bug Details

### Bug Condition

O bug se manifesta em dois pontos distintos da cadeia de processamento:

**Bug 1 — Contact Flow**: O bloco `UpdateContactAttributes` referencia `$.StoredCustomerInput` para ler a entrada do cliente. Em canais de voz com DTMF, essa referência funciona. Em chat/email com `GetParticipantInput` + `InputType: "Text"`, a resposta do cliente é armazenada em `$.Text` — não em `$.StoredCustomerInput`. O atributo `numeroChamado` fica vazio.

**Bug 2 — Lambda**: A função executa `table.get_item(Key={'idChamado': numero_chamado, 'id_Chamado': numero_chamado})`, assumindo que sort key = partition key. Os dados reais têm valores distintos, então `get_item` retorna `{}` (item não encontrado) mesmo quando o chamado existe.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input com campos {canal, numeroChamado, idChamado_real, id_Chamado_real}
  OUTPUT: boolean

  bug1 := input.canal IN ['chat', 'email']
          AND input.numeroChamado = ""   -- captura falhou via $.StoredCustomerInput

  bug2 := input.numeroChamado != ""
          AND input.idChamado_real != input.id_Chamado_real
          AND get_item_usado_com_sort_key_igual_partition_key

  RETURN bug1 OR bug2
END FUNCTION
```

### Examples

- **Bug 1**: Cliente digita "2001" no chat → `$.StoredCustomerInput` = vazio → `numeroChamado` = "" → Lambda retorna "Não recebi o número do chamado" sem consultar DynamoDB
- **Bug 2**: `numeroChamado` = "2001" chega na Lambda → `get_item(Key={'idChamado':'2001','id_Chamado':'2001'})` → DynamoDB retorna `{}` porque o item real tem `id_Chamado: "1"` → Lambda retorna "Chamado não encontrado"
- **Bug 1+2 combinado**: Mesmo que Bug 1 fosse corrigido isoladamente, Bug 2 ainda impediria encontrar o chamado
- **Edge case**: `numeroChamado` = "9999" (não existe) → após correção, `query` retorna lista vazia → mensagem "Chamado não encontrado" (comportamento correto preservado)


## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Quando o cliente informa um número de chamado válido que existe no DynamoDB, o sistema deve continuar exibindo os detalhes completos (nome, cidade, descrição, status, valores, resolução)
- Quando o número do chamado não existe no DynamoDB, o sistema deve continuar retornando mensagem informativa de "não encontrado"
- Quando a Lambda lança exceção (timeout, permissão negada), o sistema deve continuar retornando mensagem de erro genérica sem expor detalhes técnicos
- Quando o cliente não responde dentro do tempo limite, o sistema deve continuar informando timeout e encerrar amigavelmente
- O fluxo deve continuar encerrando com mensagem de agradecimento e `DisconnectParticipant`

**Scope:**
Todos os inputs que NÃO envolvem a captura de texto em chat/email devem ser completamente inalterados. Isso inclui:
- Tratamento de erros da Lambda (timeout, quota excedida)
- Tratamento de chamado não encontrado
- Mensagem de encerramento
- Estrutura geral do Contact Flow (sequência de blocos)

**Nota:** O comportamento correto esperado para os inputs bugados está definido nas Correctness Properties abaixo.


## Hypothesized Root Cause

Com base na análise do Contact Flow JSON existente e na descrição dos bugs:

1. **Referência de atributo incorreta no Contact Flow**: O bloco `block-003` (`UpdateContactAttributes`) usa `"Value": "$.StoredCustomerInput"`. Esta referência é válida apenas para blocos `StoreCustomerInput` (DTMF/voz). O bloco `block-002` é `GetParticipantInput` com `InputType: "Text"` — neste caso, a resposta do cliente fica disponível em `$.Text`. A correção é trocar a referência para `"$.Text"`.

2. **Uso de `get_item` com sort key assumido**: A Lambda usa `get_item` com `Key={'idChamado': X, 'id_Chamado': X}`. O desenvolvedor assumiu que `id_Chamado` teria o mesmo valor de `idChamado`, mas a tabela usa `id_Chamado` como contador sequencial independente. A correção é usar `query` com `KeyConditionExpression=Key('idChamado').eq(numero_chamado)`, que busca apenas pelo partition key e retorna todos os itens com aquele `idChamado`.

3. **Ausência de código Lambda**: O diretório `lambda/` está vazio no repositório. A Lambda precisa ser criada do zero com a lógica correta.

4. **Possível confusão entre `$.StoredCustomerInput` e `$.Text`**: A documentação do Amazon Connect distingue os dois: `StoredCustomerInput` é para DTMF, `Text` é para entrada de texto em chat. O Contact Flow atual mistura os dois paradigmas.


## Correctness Properties

Property 1: Bug Condition — Captura de Texto em Chat/Email

_For any_ input onde o cliente digita um número de chamado em canal de chat ou email (isBugCondition retorna true para Bug 1), a função `GetParticipantInput` corrigida SHALL armazenar o texto digitado em `$.Text`, e o bloco `UpdateContactAttributes` SHALL popular `numeroChamado` com esse valor não-vazio, permitindo que a Lambda seja invocada com o número correto.

**Validates: Requirements 2.1, 2.2**

Property 2: Bug Condition — Consulta DynamoDB por Partition Key

_For any_ input onde `numeroChamado` é um valor válido e o item existe na tabela com `idChamado = numeroChamado` (isBugCondition retorna true para Bug 2), a Lambda corrigida SHALL encontrar o item usando `query` com `KeyConditionExpression=Key('idChamado').eq(numero_chamado)` e SHALL retornar `chamadoDetalhes` com os dados do chamado.

**Validates: Requirements 2.3, 2.4**

Property 3: Preservation — Comportamentos de Erro Inalterados

_For any_ input onde o bug condition NÃO se aplica (chamado não encontrado, timeout, exceção Lambda, número vazio), a função corrigida SHALL produzir exatamente o mesmo resultado que a função original, preservando todas as mensagens de erro e o fluxo de encerramento.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**


## Fix Implementation

### Changes Required

#### Fix 1 — Contact Flow: Corrigir referência de atributo

**File**: `Amazon-Connect/04-connect-lambda-dynamodb/connect/04-connect-lambda-dynamodb.json`

**Block**: `block-003` (`UpdateContactAttributes`)

**Specific Change**:
```json
// ANTES (bugado):
"Value": "$.StoredCustomerInput"

// DEPOIS (corrigido):
"Value": "$.Text"
```

**Justificativa**: `GetParticipantInput` com `InputType: "Text"` armazena a resposta em `$.Text`. A referência `$.StoredCustomerInput` é exclusiva do bloco `StoreCustomerInput` (DTMF).

---

#### Fix 2 — Lambda: Criar função com `query` por partition key

**File**: `Amazon-Connect/04-connect-lambda-dynamodb/lambda/lambda_function.py` (novo arquivo)

**Specific Changes**:
1. **Substituir `get_item` por `query`**: Usar `KeyConditionExpression=Key('idChamado').eq(numero_chamado)` sem sort key
2. **Tratar lista de resultados**: `query` retorna `Items` (lista); pegar o primeiro item se existir
3. **Manter tratamento de erros**: Preservar blocos `try/except` para erros genéricos
4. **Manter validação de entrada**: Preservar verificação de `numeroChamado` vazio
5. **Manter formato de retorno**: `chamadoDetalhes` como string formatada acessível via `$.External.chamadoDetalhes`

**Código completo da Lambda corrigida**:

```python
import json
import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('t_chamado')

def lambda_handler(event, context):
    # Lê o número do chamado dos atributos de contato
    numero_chamado = event.get('Details', {}).get('ContactData', {}).get(
        'Attributes', {}
    ).get('numeroChamado', '').strip()

    if not numero_chamado:
        return {'chamadoDetalhes': 'Não recebi o número do chamado. Por favor, tente novamente.'}

    try:
        # Query por partition key apenas (sem sort key)
        response = table.query(
            KeyConditionExpression=Key('idChamado').eq(numero_chamado)
        )
        items = response.get('Items', [])

        if not items:
            return {'chamadoDetalhes': f'Chamado {numero_chamado} não encontrado. Verifique o número e tente novamente.'}

        item = items[0]  # Pega o primeiro item com esse idChamado

        detalhes = (
            f"Chamado: {item.get('idChamado', 'N/A')} | "
            f"Cliente: {item.get('NOME', 'N/A')} | "
            f"Cidade: {item.get('cidade', 'N/A')} | "
            f"Status: {item.get('status', 'N/A')} | "
            f"Problema: {item.get('descricaoProblema', 'N/A')} | "
            f"Resolução: {item.get('resolucao', 'N/A')} | "
            f"Valor Transação: {item.get('valorTransacao', 'N/A')} | "
            f"Valor Recebido: {item.get('valorRecebido', 'N/A')}"
        )
        return {'chamadoDetalhes': detalhes}

    except Exception as e:
        print(f"Erro ao consultar DynamoDB: {str(e)}")
        return {'chamadoDetalhes': 'Erro ao consultar o sistema. Por favor, tente novamente em instantes.'}
```


#### Contact Flow JSON Corrigido (completo)

**File**: `Amazon-Connect/04-connect-lambda-dynamodb/connect/04-connect-lambda-dynamodb.json`

A única mudança é no `block-003` — `"$.StoredCustomerInput"` → `"$.Text"`:

```json
{
  "Version": "2019-10-30",
  "StartAction": "block-001",
  "Metadata": {
    "entryPointPosition": { "x": 40, "y": 40 },
    "ActionMetadata": {
      "block-001": { "position": { "x": 200, "y": 40 } },
      "block-002": { "position": { "x": 460, "y": 40 } },
      "block-003": { "position": { "x": 720, "y": 40 } },
      "block-004": { "position": { "x": 980, "y": 40 } },
      "block-005": { "position": { "x": 1240, "y": 40 } },
      "block-006": { "position": { "x": 1500, "y": 40 } },
      "block-007": { "position": { "x": 1500, "y": 240 } },
      "block-008": { "position": { "x": 1240, "y": 240 } },
      "block-009": { "position": { "x": 980, "y": 240 } }
    },
    "name": "04-connect-lambda-dynamodb",
    "description": "Fluxo de consulta de chamados via chat - Lambda + DynamoDB"
  },
  "Actions": [
    {
      "Identifier": "block-001",
      "Type": "MessageParticipant",
      "Parameters": {
        "Text": "Olá! Bem-vindo ao suporte. Em que posso ajudar você hoje? Se tiver um chamado em aberto, por favor informe o número."
      },
      "Transitions": {
        "NextAction": "block-002",
        "Errors": [{ "NextAction": "block-009", "ErrorType": "NoMatchingError" }]
      }
    },
    {
      "Identifier": "block-002",
      "Type": "GetParticipantInput",
      "Parameters": {
        "Text": "Por favor, digite o número do seu chamado.",
        "InputTimeLimitSeconds": "60",
        "StoreDTMFInput": false,
        "InputType": "Text"
      },
      "Transitions": {
        "NextAction": "block-003",
        "Conditions": [],
        "Errors": [
          { "NextAction": "block-008", "ErrorType": "InputTimeLimitExceeded" },
          { "NextAction": "block-008", "ErrorType": "NoMatchingCondition" },
          { "NextAction": "block-009", "ErrorType": "NoMatchingError" }
        ]
      }
    },
    {
      "Identifier": "block-003",
      "Type": "UpdateContactAttributes",
      "Parameters": {
        "Attributes": [
          {
            "Name": "numeroChamado",
            "Value": "$.Text"
          }
        ]
      },
      "Transitions": {
        "NextAction": "block-004",
        "Errors": [{ "NextAction": "block-009", "ErrorType": "NoMatchingError" }]
      }
    },
    {
      "Identifier": "block-004",
      "Type": "InvokeLambdaFunction",
      "Parameters": {
        "LambdaFunctionARN": "arn:aws:lambda:us-east-1:387290985356:function:04-connect-lambda-dynamodb",
        "InvocationTimeLimitSeconds": "8",
        "LambdaInvocationAttributes": {
          "numeroChamado": "$.Attributes.numeroChamado"
        },
        "ResponseValidation": { "ResponseType": "STRING_MAP" }
      },
      "Transitions": {
        "NextAction": "block-005",
        "Errors": [
          { "NextAction": "block-007", "ErrorType": "ServiceQuotaExceededException" },
          { "NextAction": "block-007", "ErrorType": "Timeout" },
          { "NextAction": "block-009", "ErrorType": "NoMatchingError" }
        ]
      }
    },
    {
      "Identifier": "block-005",
      "Type": "MessageParticipant",
      "Parameters": { "Text": "$.External.chamadoDetalhes" },
      "Transitions": {
        "NextAction": "block-006",
        "Errors": [{ "NextAction": "block-009", "ErrorType": "NoMatchingError" }]
      }
    },
    {
      "Identifier": "block-006",
      "Type": "MessageParticipant",
      "Parameters": { "Text": "Obrigado por entrar em contato. Se precisar de mais ajuda, não hesite em nos contatar. Até logo!" },
      "Transitions": {
        "NextAction": "block-terminate",
        "Errors": [{ "NextAction": "block-009", "ErrorType": "NoMatchingError" }]
      }
    },
    {
      "Identifier": "block-007",
      "Type": "MessageParticipant",
      "Parameters": { "Text": "Não foi possível consultar o chamado no momento. Nosso sistema está temporariamente indisponível. Por favor, tente novamente em alguns instantes." },
      "Transitions": {
        "NextAction": "block-terminate",
        "Errors": [{ "NextAction": "block-009", "ErrorType": "NoMatchingError" }]
      }
    },
    {
      "Identifier": "block-008",
      "Type": "MessageParticipant",
      "Parameters": { "Text": "Não recebi o número do chamado dentro do tempo esperado. Por favor, inicie um novo atendimento e informe o número quando solicitado." },
      "Transitions": {
        "NextAction": "block-terminate",
        "Errors": [{ "NextAction": "block-009", "ErrorType": "NoMatchingError" }]
      }
    },
    {
      "Identifier": "block-009",
      "Type": "MessageParticipant",
      "Parameters": { "Text": "Ocorreu um erro inesperado. Por favor, entre em contato com nosso suporte técnico." },
      "Transitions": {
        "NextAction": "block-terminate",
        "Errors": []
      }
    },
    {
      "Identifier": "block-terminate",
      "Type": "DisconnectParticipant",
      "Parameters": {},
      "Transitions": {}
    }
  ]
}
```


## Diagrama de Fluxo

```
[Entrada do Contato]
        │
        ▼
┌─────────────────────────────────────────────────────┐
│ block-001: MessageParticipant                       │
│ "Olá! Bem-vindo... informe o número do chamado."    │
└─────────────────────────────────────────────────────┘
        │ OK
        ▼
┌─────────────────────────────────────────────────────┐
│ block-002: GetParticipantInput                      │
│ InputType: "Text" | Timeout: 60s                    │
│ "Por favor, digite o número do seu chamado."        │
└─────────────────────────────────────────────────────┘
        │ OK ($.Text = número digitado)
        ├──── Timeout ──────────────────────────────► block-008 (timeout msg) ──► block-terminate
        ├──── NoMatchingCondition ──────────────────► block-008 (timeout msg) ──► block-terminate
        │
        ▼
┌─────────────────────────────────────────────────────┐
│ block-003: UpdateContactAttributes                  │
│ numeroChamado = $.Text  ◄── CORREÇÃO BUG 1          │
│ (era: $.StoredCustomerInput)                        │
└─────────────────────────────────────────────────────┘
        │ OK
        ▼
┌─────────────────────────────────────────────────────┐
│ block-004: InvokeLambdaFunction                     │
│ Passa: numeroChamado = $.Attributes.numeroChamado   │
│ Timeout: 8s                                         │
└─────────────────────────────────────────────────────┘
        │ OK ($.External.chamadoDetalhes populado)
        ├──── Timeout / QuotaExceeded ──────────────► block-007 (sistema indisponível) ──► block-terminate
        │
        ▼
┌─────────────────────────────────────────────────────┐
│ block-005: MessageParticipant                       │
│ Exibe: $.External.chamadoDetalhes                   │
└─────────────────────────────────────────────────────┘
        │ OK
        ▼
┌─────────────────────────────────────────────────────┐
│ block-006: MessageParticipant                       │
│ "Obrigado por entrar em contato. Até logo!"         │
└─────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────┐
│ block-terminate: DisconnectParticipant              │
└─────────────────────────────────────────────────────┘

Erros genéricos (qualquer bloco) ──► block-009 (erro inesperado) ──► block-terminate

─────────────────────────────────────────────────────
Lambda (04-connect-lambda-dynamodb):

  event.Details.ContactData.Attributes.numeroChamado
        │
        ├── vazio? ──► retorna "Não recebi o número..."
        │
        ▼
  DynamoDB.query(                    ◄── CORREÇÃO BUG 2
    KeyConditionExpression=          (era: get_item com sort key errado)
      Key('idChamado').eq(numero)
  )
        │
        ├── Items vazio? ──► retorna "Chamado X não encontrado."
        │
        ▼
  Formata detalhes do item[0]
        │
        ▼
  retorna {'chamadoDetalhes': "Chamado: 2001 | Cliente: ..."}
```


## Testing Strategy

### Validation Approach

A estratégia segue duas fases: primeiro, confirmar os bugs no código não corrigido (exploratory); depois, verificar que a correção funciona e não quebra comportamentos existentes (fix + preservation checking).

### Exploratory Bug Condition Checking

**Goal**: Demonstrar os bugs ANTES da correção para confirmar a análise de root cause.

**Test Plan**: Simular o evento Lambda com `numeroChamado` válido e verificar que `get_item` falha. Simular o Contact Flow com entrada de texto e verificar que `$.StoredCustomerInput` retorna vazio.

**Test Cases**:
1. **Lambda Bug 2 — get_item com sort key errado**: Chamar Lambda com `numeroChamado="2001"` no código original → espera-se "Chamado não encontrado" mesmo com item existente (falha no unfixed code)
2. **Lambda Bug 2 — query retorna item**: Chamar Lambda corrigida com `numeroChamado="2001"` → espera-se detalhes do chamado
3. **Contact Flow Bug 1 — referência $.Text**: Verificar que `block-003` usa `$.Text` (não `$.StoredCustomerInput`) no JSON corrigido
4. **Edge case — chamado inexistente**: Chamar Lambda com `numeroChamado="9999"` → espera-se "Chamado 9999 não encontrado"

**Expected Counterexamples**:
- `get_item(Key={'idChamado':'2001','id_Chamado':'2001'})` retorna `{}` porque o item real tem `id_Chamado: "1"`
- `$.StoredCustomerInput` retorna string vazia em contexto de chat

### Fix Checking

**Goal**: Verificar que para todos os inputs onde o bug condition se aplica, a função corrigida produz o comportamento esperado.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := lambda_corrigida(input)
  ASSERT result['chamadoDetalhes'] contém dados do chamado
  ASSERT result['chamadoDetalhes'] != "Chamado não encontrado"
  ASSERT result['chamadoDetalhes'] != "Não recebi o número"
END FOR
```

### Preservation Checking

**Goal**: Verificar que para todos os inputs onde o bug condition NÃO se aplica, a função corrigida produz o mesmo resultado que a original.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT lambda_original(input) = lambda_corrigida(input)
END FOR
```

**Testing Approach**: Property-based testing é recomendado para preservation checking porque:
- Gera automaticamente muitos casos de teste no domínio de entrada
- Captura edge cases que testes manuais podem perder
- Fornece garantias fortes de que o comportamento é preservado para todos os inputs não-bugados

**Test Cases**:
1. **Chamado não encontrado**: `numeroChamado="9999"` → ambas as versões retornam "não encontrado"
2. **Número vazio**: `numeroChamado=""` → ambas retornam "Não recebi o número"
3. **Exceção DynamoDB**: Simular erro de permissão → ambas retornam mensagem genérica de erro
4. **Timeout Lambda**: Simular timeout → Contact Flow desvia para `block-007` em ambas as versões

### Unit Tests

- Testar Lambda com `numeroChamado` válido existente → retorna detalhes formatados
- Testar Lambda com `numeroChamado` válido inexistente → retorna "não encontrado"
- Testar Lambda com `numeroChamado` vazio → retorna "Não recebi o número"
- Testar Lambda com exceção DynamoDB simulada → retorna mensagem genérica
- Verificar que Contact Flow JSON usa `$.Text` no `block-003`

### Property-Based Tests

- Gerar `numeroChamado` aleatórios (strings de 1-10 dígitos) e verificar que Lambda nunca lança exceção não tratada
- Gerar itens DynamoDB com `idChamado` e `id_Chamado` distintos e verificar que `query` sempre encontra o item correto
- Verificar que para qualquer `numeroChamado` não-vazio, a resposta sempre contém a chave `chamadoDetalhes`

### Integration Tests

- Fluxo completo: cliente digita "2001" no chat → Contact Flow captura → Lambda consulta → exibe detalhes
- Fluxo de timeout: cliente não responde em 60s → mensagem de timeout → desconexão
- Fluxo de erro Lambda: Lambda retorna erro → `block-007` exibe mensagem amigável → desconexão
- Fluxo de chamado inexistente: cliente digita "9999" → Lambda retorna "não encontrado" → exibido no chat → desconexão com agradecimento


## Deploy Instructions

### 1. Permissões IAM necessárias

#### Lambda Execution Role

A role da Lambda precisa das seguintes permissões:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:Query"
      ],
      "Resource": "arn:aws:dynamodb:us-east-1:387290985356:table/t_chamado"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

> **Nota**: A permissão `dynamodb:GetItem` pode ser removida — a correção usa apenas `dynamodb:Query`.

#### Amazon Connect → Lambda

No console do Amazon Connect, a instância precisa ter permissão para invocar a Lambda:
- Vá em **Amazon Connect → sua instância → Flows → AWS Lambda**
- Adicione a função `04-connect-lambda-dynamodb` à lista de funções permitidas
- Isso cria automaticamente a resource-based policy na Lambda

### 2. Deploy da Lambda

```bash
# Criar arquivo zip
zip lambda_function.zip lambda_function.py

# Criar função (primeira vez)
aws lambda create-function \
  --function-name 04-connect-lambda-dynamodb \
  --runtime python3.12 \
  --role arn:aws:iam::387290985356:role/lambda-connect-dynamodb-role \
  --handler lambda_function.lambda_handler \
  --zip-file fileb://lambda_function.zip \
  --timeout 10 \
  --region us-east-1

# Atualizar função (se já existir)
aws lambda update-function-code \
  --function-name 04-connect-lambda-dynamodb \
  --zip-file fileb://lambda_function.zip \
  --region us-east-1
```

### 3. Importar o Contact Flow no Amazon Connect

1. Acesse o console do Amazon Connect → sua instância → **Contact flows**
2. Clique em **Create contact flow**
3. No menu superior direito, clique em **Import flow (beta)**
4. Selecione o arquivo `04-connect-lambda-dynamodb.json` corrigido
5. Após importar, verifique o bloco `Invoke AWS Lambda function` e confirme que o ARN da Lambda está correto
6. Clique em **Save** e depois **Publish**

### 4. Associar o Contact Flow ao canal de chat/email

- Para **chat**: Vá em **Routing → Phone numbers** (ou Chat widget) e associe o Contact Flow publicado
- Para **email**: Vá em **Channels → Email** e associe o Contact Flow ao endereço de email configurado

### 5. Verificação pós-deploy

1. Inicie uma sessão de chat de teste no Amazon Connect CCP
2. Digite um número de chamado válido (ex: "2001")
3. Verifique que a resposta exibe os detalhes do chamado
4. Teste com número inexistente (ex: "9999") — deve retornar "não encontrado"
5. Aguarde o timeout (60s sem resposta) — deve exibir mensagem de timeout

