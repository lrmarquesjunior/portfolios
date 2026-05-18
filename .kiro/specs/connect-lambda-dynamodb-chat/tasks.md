# Implementation Plan

## Overview

Plano de implementação para corrigir dois bugs no fluxo Amazon Connect + Lambda + DynamoDB para canais de chat/email:
1. **Bug 1 (Contact Flow)**: Trocar `$.StoredCustomerInput` por `$.Text` no bloco `UpdateContactAttributes` (`block-003`)
2. **Bug 2 (Lambda)**: Substituir `get_item` com sort key assumido por `query` com `KeyConditionExpression=Key('idChamado').eq(numero_chamado)`

A ordem das tarefas segue o workflow exploratório: escrever testes de bug condition → escrever testes de preservation → implementar correções → validar.

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1", "2"] },
    { "wave": 2, "tasks": ["3.1", "3.2", "3.3", "3.4"] },
    { "wave": 3, "tasks": ["3.5", "3.6"] },
    { "wave": 4, "tasks": ["4"] }
  ]
}
```

## Tasks

- [ ] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Lambda get_item com sort key incorreto + Contact Flow $.StoredCustomerInput vazio
  - **CRITICAL**: Este teste DEVE FALHAR no código não corrigido — a falha confirma que o bug existe
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: Este teste codifica o comportamento esperado — ele validará a correção quando passar após a implementação
  - **GOAL**: Surfaçar contraexemplos que demonstram os dois bugs
  - **Scoped PBT Approach**: Para Bug 2 (Lambda), escopar a propriedade ao caso concreto: `numeroChamado="2001"` com item real tendo `id_Chamado="1"` (diferente do partition key)
  - Criar arquivo `Amazon-Connect/04-connect-lambda-dynamodb-lex/lambda/tests/test_bug_condition.py`
  - **Bug 1 — Contact Flow**: Verificar que o JSON do Contact Flow atual (se existir) usa `$.StoredCustomerInput` no `block-003` — confirmar que a referência errada está presente
  - **Bug 2 — Lambda (get_item)**: Escrever teste que simula `get_item` com `Key={'idChamado':'2001','id_Chamado':'2001'}` contra mock DynamoDB onde o item real tem `id_Chamado='1'`; assertar que o resultado é `{}` (item não encontrado) — isso confirma o bug
  - **Property**: Para qualquer `numeroChamado` válido onde `idChamado != id_Chamado` no item real, `get_item(Key={idChamado: X, id_Chamado: X})` retorna `{}` (falha ao encontrar)
  - Executar teste no código NÃO corrigido
  - **EXPECTED OUTCOME**: Teste FALHA ao assertar que o chamado deveria ser encontrado (confirma o bug)
  - Documentar contraexemplos encontrados: ex. `get_item(Key={'idChamado':'2001','id_Chamado':'2001'})` retorna `{}` porque item real tem `id_Chamado: '1'`
  - Marcar tarefa completa quando o teste estiver escrito, executado e a falha documentada
  - _Requirements: 1.4_

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Comportamentos de erro e encerramento inalterados
  - **IMPORTANT**: Seguir metodologia observation-first
  - Criar arquivo `Amazon-Connect/04-connect-lambda-dynamodb-lex/lambda/tests/test_preservation.py`
  - **Observar no código não corrigido**:
    - `lambda_handler({'Details':{'ContactData':{'Attributes':{'numeroChamado':''}}}}, {})` retorna `{'chamadoDetalhes': 'Não recebi o número do chamado. Por favor, tente novamente.'}`
    - `lambda_handler` com DynamoDB lançando exceção retorna `{'chamadoDetalhes': 'Erro ao consultar o sistema. Por favor, tente novamente em instantes.'}`
    - `lambda_handler` com `numeroChamado='9999'` (inexistente) retorna mensagem "não encontrado"
  - **Property-based test**: Para qualquer `numeroChamado` vazio ou None, a resposta sempre contém a chave `chamadoDetalhes` com mensagem de "Não recebi o número"
  - **Property-based test**: Para qualquer exceção lançada pelo DynamoDB, a resposta sempre contém `chamadoDetalhes` com mensagem genérica (sem stack trace ou detalhes técnicos)
  - **Property-based test**: Para qualquer `numeroChamado` de 1-10 dígitos que não existe na tabela, a resposta contém `chamadoDetalhes` com "não encontrado"
  - Executar testes no código NÃO corrigido
  - **EXPECTED OUTCOME**: Testes PASSAM (confirma comportamento baseline a preservar)
  - Marcar tarefa completa quando os testes estiverem escritos, executados e passando no código não corrigido
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 3. Fix para Contact Flow ($.StoredCustomerInput → $.Text) e Lambda (get_item → query)

  - [ ] 3.1 Criar Lambda corrigida com query por partition key
    - Criar arquivo `Amazon-Connect/04-connect-lambda-dynamodb-lex/lambda/lambda_function.py`
    - Substituir `get_item(Key={'idChamado': X, 'id_Chamado': X})` por `table.query(KeyConditionExpression=Key('idChamado').eq(numero_chamado))`
    - Tratar resultado como lista: `items = response.get('Items', [])`, usar `items[0]` se não vazio
    - Manter validação de `numeroChamado` vazio (retorna "Não recebi o número do chamado")
    - Manter bloco `try/except Exception` para erros genéricos (retorna mensagem sem detalhes técnicos)
    - Manter formato de retorno `{'chamadoDetalhes': ...}` acessível via `$.External.chamadoDetalhes`
    - Manter campos formatados: `idChamado`, `NOME`, `cidade`, `status`, `descricaoProblema`, `resolucao`, `valorTransacao`, `valorRecebido`
    - _Bug_Condition: isBugCondition(input) onde `get_item` com `id_Chamado = idChamado` falha porque sort key é independente_
    - _Expected_Behavior: `query(KeyConditionExpression=Key('idChamado').eq(numero_chamado))` retorna `Items` com o chamado correto_
    - _Preservation: Comportamentos de erro (vazio, não encontrado, exceção) permanecem idênticos_
    - _Requirements: 2.3, 2.4, 3.1, 3.2, 3.3_

  - [ ] 3.2 Criar Contact Flow JSON corrigido
    - Criar arquivo `Amazon-Connect/04-connect-lambda-dynamodb-lex/contact-flows/04-connect-lambda-dynamodb.json`
    - No `block-003` (`UpdateContactAttributes`), alterar `"Value": "$.StoredCustomerInput"` para `"Value": "$.Text"`
    - Manter todos os outros blocos inalterados: `block-001` (boas-vindas), `block-002` (GetParticipantInput com InputType Text), `block-004` (InvokeLambdaFunction), `block-005` (exibe detalhes), `block-006` (agradecimento), `block-007` (erro Lambda), `block-008` (timeout), `block-009` (erro genérico), `block-terminate` (DisconnectParticipant)
    - _Bug_Condition: `$.StoredCustomerInput` retorna vazio em chat/email; `$.Text` é o campo correto para GetParticipantInput com InputType Text_
    - _Expected_Behavior: `block-003` popula `numeroChamado` com o texto digitado pelo cliente via `$.Text`_
    - _Requirements: 2.1, 2.2_

  - [ ] 3.3 Criar testes unitários completos para a Lambda
    - Criar arquivo `Amazon-Connect/04-connect-lambda-dynamodb-lex/lambda/tests/test_lambda_function.py`
    - Testar: `numeroChamado` válido existente → retorna detalhes formatados com todos os campos
    - Testar: `numeroChamado` válido inexistente → retorna "Chamado X não encontrado"
    - Testar: `numeroChamado` vazio → retorna "Não recebi o número do chamado"
    - Testar: `numeroChamado` None (chave ausente no evento) → retorna "Não recebi o número do chamado"
    - Testar: exceção DynamoDB simulada → retorna mensagem genérica sem detalhes técnicos
    - Testar: `query` chamado com `KeyConditionExpression` correto (sem sort key)
    - Usar `unittest.mock.patch` para mockar `boto3.resource` e `table.query`
    - _Requirements: 2.3, 2.4, 3.1, 3.2, 3.3_

  - [ ] 3.4 Atualizar README
    - Atualizar `Amazon-Connect/04-connect-lambda-dynamodb-lex/README.md` com descrição do projeto, arquitetura, bugs corrigidos e instruções de deploy
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ] 3.5 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Lambda query encontra chamado com idChamado correto
    - **IMPORTANT**: Re-executar o MESMO teste da tarefa 1 — NÃO escrever novo teste
    - O teste da tarefa 1 codifica o comportamento esperado
    - Quando este teste passar, confirma que o comportamento esperado está satisfeito
    - Executar teste de bug condition da etapa 1 contra a Lambda corrigida
    - **EXPECTED OUTCOME**: Teste PASSA (confirma que o bug foi corrigido)
    - _Requirements: Expected Behavior Properties do design — 2.3, 2.4_

  - [ ] 3.6 Verify preservation tests still pass
    - **Property 2: Preservation** - Comportamentos de erro e encerramento inalterados
    - **IMPORTANT**: Re-executar os MESMOS testes da tarefa 2 — NÃO escrever novos testes
    - Executar testes de preservation da etapa 2 contra a Lambda corrigida
    - **EXPECTED OUTCOME**: Testes PASSAM (confirma ausência de regressões)
    - Confirmar que todos os testes passam após a correção (sem regressões)

- [ ] 4. Checkpoint - Ensure all tests pass
  - Executar toda a suite de testes: `python -m pytest Amazon-Connect/04-connect-lambda-dynamodb-lex/lambda/tests/ -v`
  - Confirmar que Property 1 (Bug Condition) passa — bug corrigido
  - Confirmar que Property 2 (Preservation) passa — sem regressões
  - Confirmar que todos os testes unitários passam
  - Verificar que o Contact Flow JSON usa `$.Text` no `block-003` (não `$.StoredCustomerInput`)
  - Verificar que a Lambda usa `table.query` com `KeyConditionExpression` (não `get_item`)
  - Garantir que todos os testes passam; perguntar ao usuário se surgirem dúvidas.

## Notes

- Os testes de bug condition (tarefa 1) devem ser escritos e executados ANTES de qualquer correção de código
- Os testes de preservation (tarefa 2) devem ser escritos e executados ANTES de qualquer correção de código
- A Lambda corrigida deve ser criada em `Amazon-Connect/04-connect-lambda-dynamodb-lex/lambda/lambda_function.py`
- O Contact Flow corrigido deve ser criado em `Amazon-Connect/04-connect-lambda-dynamodb-lex/contact-flows/04-connect-lambda-dynamodb.json`
- Usar `unittest.mock.patch` para mockar chamadas ao DynamoDB nos testes unitários
- O pytest pode ser executado com: `python -m pytest Amazon-Connect/04-connect-lambda-dynamodb-lex/lambda/tests/ -v`
- Referências de design: `bugfix.md` (requisitos) e `design.md` (especificação técnica completa com pseudocódigo)
