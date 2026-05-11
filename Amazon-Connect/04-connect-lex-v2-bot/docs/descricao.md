# Descrição Técnica — Connect + Lex V2 Bot

## Problema

O Lex V1 tem limitações para conversas mais complexas que precisam coletar múltiplos dados do cliente com validação em tempo real.

## Solução

Lex V2 com Lambda como fulfillment hook, permitindo validação de slots customizada e conversas multi-turno mais naturais.

## Diferenças Lex V1 vs Lex V2 no Connect

| Aspecto | Lex V1 | Lex V2 |
|---|---|---|
| Integração Connect | Nativa, sem configuração extra | Requer associação explícita no Connect |
| Conversas multi-turno | Limitado | Nativo |
| Validação de slots | Via Lambda separada | Lambda unificada (DialogCodeHook) |
| Versionamento | Manual | Aliases e versões nativas |
| Idiomas | Por bot | Múltiplos idiomas no mesmo bot |

## Lições Aprendidas

> _Preencher após conclusão do projeto_
