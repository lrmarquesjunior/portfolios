# Descrição Técnica — Connect Básico + Lex

## Problema

Empresa precisa de um atendimento telefônico automatizado que direcione o cliente para a fila correta sem intervenção humana na triagem inicial.

## Solução

Fluxo no Amazon Connect que usa Amazon Lex para capturar a intenção do cliente e rotear para a fila adequada.

## Decisões de Arquitetura

- **Amazon Lex V1** utilizado por ser nativo no Connect sem configuração adicional de permissões
- **Polly** com voz pt-BR para melhor experiência do cliente
- Fallback para fila geral quando intenção não é reconhecida após 2 tentativas

## Lições Aprendidas

> _Preencher após conclusão do projeto_
