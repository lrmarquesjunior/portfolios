# Documento de Requisitos

## Introduction

Este documento descreve os requisitos para o fluxo de busca de dados do cliente no Amazon Connect. Durante um atendimento (chamada de voz ou chat), o fluxo deve identificar o cliente pelo número de telefone (ou outro identificador) e recuperar seus dados de um banco de dados (DynamoDB ou PostgreSQL) via AWS Lambda. As informações recuperadas são utilizadas para personalizar o atendimento, pré-preencher dados para o agente e tomar decisões de roteamento inteligente.

Este projeto faz parte de um portfólio AWS e demonstra integração entre Amazon Connect, AWS Lambda e serviços de banco de dados gerenciados.

---

## Glossary

- **Connect_Flow**: Fluxo de contato (Contact Flow) configurado no Amazon Connect que orquestra o atendimento.
- **Lambda_Function**: Função AWS Lambda responsável por consultar o banco de dados e retornar os dados do cliente.
- **Customer_Record**: Registro do cliente armazenado no banco de dados, contendo atributos como nome, CPF, histórico de atendimentos e segmento.
- **Contact_Attribute**: Atributo de contato do Amazon Connect, utilizado para armazenar e transmitir dados durante o fluxo.
- **DynamoDB_Table**: Tabela no Amazon DynamoDB usada como banco de dados principal para lookup de clientes.
- **PostgreSQL_DB**: Banco de dados relacional PostgreSQL (ex: Amazon RDS ou Aurora) usado como alternativa ao DynamoDB.
- **ANI**: Automatic Number Identification — número de telefone do chamador, capturado automaticamente pelo Amazon Connect.
- **Agente**: Atendente humano que recebe o contato após o fluxo de IVR.
- **IVR**: Interactive Voice Response — sistema de atendimento automático por voz.
- **CCP**: Contact Control Panel — interface do agente no Amazon Connect.
- **Timeout**: Tempo máximo de espera por uma resposta da Lambda_Function antes de acionar o tratamento de erro.

---

## Requirements

### Requirement 1: Captura do Identificador do Cliente

**User Story:** Como desenvolvedor do fluxo, quero que o Connect_Flow capture automaticamente o número de telefone do chamador, para que a busca do cliente seja iniciada sem intervenção manual.

#### Critérios de Aceitação

1. WHEN um contato de voz é iniciado, THE Connect_Flow SHALL capturar o ANI do chamador e armazená-lo como Contact_Attribute com a chave `customerPhoneNumber`.
2. WHEN um contato de chat é iniciado, THE Connect_Flow SHALL capturar o identificador fornecido pelo canal de origem e armazená-lo como Contact_Attribute com a chave `customerIdentifier`.
3. IF o ANI não estiver disponível no contato de voz, THEN THE Connect_Flow SHALL definir o Contact_Attribute `lookupStatus` com o valor `"identifier_not_found"` e encaminhar o contato para o bloco de tratamento de erro.

---

### Requirement 2: Invocação da Lambda de Lookup

**User Story:** Como desenvolvedor do fluxo, quero que o Connect_Flow invoque a Lambda_Function com o identificador do cliente, para que os dados sejam recuperados do banco de dados em tempo real.

#### Critérios de Aceitação

1. WHEN o Contact_Attribute `customerPhoneNumber` ou `customerIdentifier` estiver definido, THE Connect_Flow SHALL invocar a Lambda_Function passando o identificador como parâmetro de entrada.
2. THE Lambda_Function SHALL aceitar um payload JSON contendo ao menos o campo `identifier` com o valor do identificador do cliente.
3. THE Lambda_Function SHALL retornar um payload JSON contendo os campos `found` (booleano), e quando `found` for `true`, os campos `customerName`, `customerId`, `segment` e `lastContactDate`.
4. THE Connect_Flow SHALL definir um Timeout de 8 segundos para a invocação da Lambda_Function.
5. IF a Lambda_Function não responder dentro do Timeout, THEN THE Connect_Flow SHALL definir o Contact_Attribute `lookupStatus` com o valor `"timeout"` e encaminhar o contato para o bloco de tratamento de erro.

---

### Requirement 3: Consulta ao DynamoDB

**User Story:** Como desenvolvedor, quero que a Lambda_Function consulte o DynamoDB_Table pelo identificador do cliente, para que a busca seja rápida e escalável.

#### Critérios de Aceitação

1. WHEN a Lambda_Function recebe um `identifier` válido, THE Lambda_Function SHALL executar uma operação `GetItem` na DynamoDB_Table usando o `identifier` como chave de partição.
2. WHEN o item é encontrado na DynamoDB_Table, THE Lambda_Function SHALL retornar o Customer_Record com o campo `found` igual a `true`.
3. IF o item não for encontrado na DynamoDB_Table, THEN THE Lambda_Function SHALL retornar um payload com o campo `found` igual a `false` e o campo `reason` igual a `"customer_not_found"`.
4. IF a DynamoDB_Table retornar um erro de serviço, THEN THE Lambda_Function SHALL registrar o erro no Amazon CloudWatch Logs e retornar um payload com o campo `found` igual a `false` e o campo `reason` igual a `"database_error"`.

---

### Requirement 4: Consulta ao PostgreSQL (Alternativa Relacional)

**User Story:** Como desenvolvedor, quero que a Lambda_Function suporte consulta ao PostgreSQL_DB como alternativa ao DynamoDB, para que o fluxo possa ser adaptado a ambientes com banco de dados relacional.

#### Critérios de Aceitação

1. WHERE a configuração da Lambda_Function indicar `DATABASE_TYPE=postgresql`, THE Lambda_Function SHALL executar uma query parametrizada na PostgreSQL_DB usando o `identifier` como critério de busca.
2. THE Lambda_Function SHALL utilizar uma query parametrizada no formato `SELECT * FROM customers WHERE phone_number = $1` para evitar SQL injection.
3. WHEN o registro é encontrado na PostgreSQL_DB, THE Lambda_Function SHALL retornar o Customer_Record com o campo `found` igual a `true`.
4. IF o registro não for encontrado na PostgreSQL_DB, THEN THE Lambda_Function SHALL retornar um payload com o campo `found` igual a `false` e o campo `reason` igual a `"customer_not_found"`.
5. IF a conexão com a PostgreSQL_DB falhar, THEN THE Lambda_Function SHALL registrar o erro no Amazon CloudWatch Logs e retornar um payload com o campo `found` igual a `false` e o campo `reason` igual a `"database_error"`.

---

### Requirement 5: Mapeamento dos Dados para Contact Attributes

**User Story:** Como desenvolvedor do fluxo, quero que os dados retornados pela Lambda_Function sejam mapeados para Contact Attributes, para que o agente e os blocos subsequentes do fluxo possam utilizá-los.

#### Critérios de Aceitação

1. WHEN a Lambda_Function retornar `found` igual a `true`, THE Connect_Flow SHALL mapear os campos `customerName`, `customerId`, `segment` e `lastContactDate` para Contact Attributes com as chaves correspondentes.
2. WHEN a Lambda_Function retornar `found` igual a `false`, THE Connect_Flow SHALL definir o Contact_Attribute `lookupStatus` com o valor `"not_found"`.
3. THE Connect_Flow SHALL definir o Contact_Attribute `lookupStatus` com o valor `"success"` quando o mapeamento dos dados for concluído com sucesso.

---

### Requirement 6: Roteamento Baseado no Resultado do Lookup

**User Story:** Como desenvolvedor do fluxo, quero que o Connect_Flow tome decisões de roteamento com base no resultado da busca, para que clientes identificados e não identificados recebam tratamentos diferenciados.

#### Critérios de Aceitação

1. WHEN o Contact_Attribute `lookupStatus` for `"success"`, THE Connect_Flow SHALL encaminhar o contato para a fila de atendimento correspondente ao valor do Contact_Attribute `segment`.
2. WHEN o Contact_Attribute `lookupStatus` for `"not_found"`, THE Connect_Flow SHALL encaminhar o contato para a fila de atendimento padrão (`default_queue`).
3. WHEN o Contact_Attribute `lookupStatus` for `"timeout"` ou `"database_error"`, THE Connect_Flow SHALL reproduzir uma mensagem de áudio informando indisponibilidade temporária e encaminhar o contato para a fila de atendimento padrão (`default_queue`).
4. WHEN o Contact_Attribute `lookupStatus` for `"identifier_not_found"`, THE Connect_Flow SHALL solicitar ao cliente que informe seu CPF via DTMF e utilizar o valor coletado como novo `customerIdentifier` para reiniciar o lookup.

---

### Requirement 7: Exibição dos Dados no CCP do Agente

**User Story:** Como agente, quero visualizar os dados do cliente no CCP no momento em que o contato chega, para que eu possa personalizar o atendimento sem precisar perguntar dados básicos.

#### Critérios de Aceitação

1. WHEN o contato é transferido para o Agente, THE Connect_Flow SHALL transmitir os Contact Attributes `customerName`, `customerId`, `segment` e `lastContactDate` junto ao contato.
2. THE Connect_Flow SHALL garantir que os Contact Attributes estejam disponíveis no CCP antes da transferência para o Agente.

---

### Requirement 8: Observabilidade e Rastreabilidade

**User Story:** Como engenheiro de operações, quero que todas as invocações e erros sejam registrados, para que eu possa monitorar a saúde do fluxo e diagnosticar falhas.

#### Critérios de Aceitação

1. THE Lambda_Function SHALL registrar no Amazon CloudWatch Logs o `identifier` recebido, o banco de dados consultado, o resultado (`found`/`not_found`/`error`) e a latência da consulta para cada invocação.
2. IF a Lambda_Function retornar `reason` igual a `"database_error"`, THEN THE Lambda_Function SHALL publicar uma métrica customizada no Amazon CloudWatch com o nome `CustomerLookupError` e a dimensão `DatabaseType`.
3. THE Lambda_Function SHALL incluir o `contactId` do Amazon Connect no log de cada invocação para correlação de eventos.

---

### Requirement 9: Segurança e Controle de Acesso

**User Story:** Como arquiteto de segurança, quero que o acesso ao banco de dados e à Lambda_Function seja restrito ao mínimo necessário, para que a solução siga o princípio do menor privilégio.

#### Critérios de Aceitação

1. THE Lambda_Function SHALL utilizar uma IAM Role com permissões restritas exclusivamente às operações `dynamodb:GetItem` na DynamoDB_Table específica, quando o banco de dados for DynamoDB.
2. WHERE a configuração indicar `DATABASE_TYPE=postgresql`, THE Lambda_Function SHALL recuperar as credenciais de conexão exclusivamente do AWS Secrets Manager, sem armazená-las em variáveis de ambiente ou código-fonte.
3. THE Connect_Flow SHALL invocar a Lambda_Function exclusivamente por meio de uma permissão de recurso (`resource-based policy`) que restrinja o invocador ao ARN da instância do Amazon Connect.
4. THE Lambda_Function SHALL ser implantada em uma VPC privada quando o banco de dados for PostgreSQL_DB, sem rota de saída para a internet pública.
