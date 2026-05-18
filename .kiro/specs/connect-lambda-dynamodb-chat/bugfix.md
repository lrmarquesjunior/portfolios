# Bugfix Requirements Document

## Introduction

O fluxo de Contact Flow no Amazon Connect para os canais **chat e email** falha ao capturar a entrada do cliente. O bloco `Store customer input` (modo Custom) foi projetado para canais de voz com DTMF, e não funciona corretamente em chat/email — onde a entrada é texto livre. Como resultado, o atributo `numeroChamado` nunca é populado, a Lambda recebe um valor vazio e o fluxo cai no caminho de erro antes de consultar o DynamoDB.

Adicionalmente, a Lambda possui um bug secundário: ela passa `id_Chamado` com o mesmo valor de `idChamado` na chave composta do DynamoDB, mas os itens reais têm valores distintos para cada chave (ex: `idChamado: "2001"`, `id_Chamado: "1"`), causando falha no `get_item` mesmo quando o chamado existe.

---

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN o cliente digita o número do chamado em um canal de **chat**, THEN o sistema falha na captura da entrada porque o bloco `Store customer input` (Custom) não suporta entrada de texto em chat, retornando erro e desviando para o caminho de erro do fluxo.

1.2 WHEN o cliente digita o número do chamado em um canal de **email**, THEN o sistema falha na captura da entrada pelo mesmo motivo — `Store customer input` não é compatível com o canal email.

1.3 WHEN o atributo `numeroChamado` chega vazio na Lambda (por falha na captura), THEN o sistema retorna a mensagem "Não recebi o número do chamado" sem consultar o DynamoDB.

1.4 WHEN a Lambda recebe um `numeroChamado` válido e tenta consultar o DynamoDB com `Key={'idChamado': numero_chamado, 'id_Chamado': numero_chamado}`, THEN o sistema não encontra o item porque o sort key `id_Chamado` tem valor diferente do partition key `idChamado` nos dados reais.

### Expected Behavior (Correct)

2.1 WHEN o cliente digita o número do chamado em um canal de **chat**, THEN o sistema SHALL capturar o texto digitado usando o bloco `Get customer input` (tipo Text) e armazená-lo no atributo `numeroChamado`.

2.2 WHEN o cliente digita o número do chamado em um canal de **email**, THEN o sistema SHALL capturar o texto da mensagem usando o bloco `Get customer input` (tipo Text) e armazená-lo no atributo `numeroChamado`.

2.3 WHEN o atributo `numeroChamado` é capturado com sucesso e enviado à Lambda, THEN o sistema SHALL consultar o DynamoDB usando apenas o partition key `idChamado` (sem sort key na query) e retornar os detalhes do chamado.

2.4 WHEN a Lambda encontra o item no DynamoDB, THEN o sistema SHALL retornar a mensagem formatada com os detalhes do chamado no campo `chamadoDetalhes`, acessível via `$.External.chamadoDetalhes` no Contact Flow.

### Unchanged Behavior (Regression Prevention)

3.1 WHEN o cliente informa um número de chamado válido que existe no DynamoDB, THEN o sistema SHALL CONTINUE TO exibir os detalhes completos do chamado (nome, cidade, descrição, status, valores, resolução).

3.2 WHEN o cliente informa um número de chamado que não existe no DynamoDB, THEN o sistema SHALL CONTINUE TO retornar uma mensagem informando que o chamado não foi encontrado.

3.3 WHEN a Lambda lança uma exceção ao consultar o DynamoDB (ex: timeout, permissão negada), THEN o sistema SHALL CONTINUE TO retornar uma mensagem de erro genérica sem expor detalhes técnicos.

3.4 WHEN o cliente não responde dentro do tempo limite configurado no bloco de captura, THEN o sistema SHALL CONTINUE TO informar o timeout e encerrar o atendimento de forma amigável.

3.5 WHEN o fluxo conclui com sucesso ou erro, THEN o sistema SHALL CONTINUE TO encerrar a sessão com a mensagem de agradecimento e desconectar o participante.
