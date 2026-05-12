# Descrição Técnica — Connect + Lambda + DynamoDB + Lex

## Problema

O atendimento básico com Lex apenas roteia o cliente para uma fila. Não há personalização — o agente ainda precisa perguntar quem é o cliente e qual é o problema.

## Solução

Combinar Lex (intenção) + Lambda + DynamoDB (dados do cliente) no mesmo fluxo. O resultado: quando o agente atende, já sabe o nome do cliente, o contrato, o status e o motivo do contato.

## Fluxo no Contact Flow

```
1. Play prompt: "Bem-vindo. Como posso ajudar?"
2. Get Customer Input (Lex) → captura intenção
3. Set Contact Attributes → salva intenção como atributo
4. Invoke Lambda → passa telefone + intenção
5. Check Contact Attributes → cliente encontrado?
   ├── Sim: "Olá $.nome, vi que você quer $.intencao..."
   └── Não: atendimento genérico
6. Roteamento para fila baseado na intenção
```

## Decisões de Arquitetura

- A **intenção do Lex** é salva como atributo de contato antes de chamar a Lambda — assim a Lambda recebe via `Parameters` e não precisa de lógica de NLU
- Lambda com **timeout de 3s** — Connect aguarda até 8s, mas deixamos margem para latência do DynamoDB
- **Fallback duplo**: cliente não encontrado no DynamoDB E intenção não reconhecida pelo Lex — ambos levam para fila geral sem travar o fluxo
- Todos os retornos da Lambda são **strings** — Connect não aceita números ou booleanos nos atributos de contato

## Lições Aprendidas

> _Preencher após conclusão do projeto_
