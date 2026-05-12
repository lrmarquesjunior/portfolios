const { DynamoDBClient, GetItemCommand } = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");

const client = new DynamoDBClient({ region: process.env.REGION || "us-east-1" });
const TABLE_NAME = process.env.DYNAMODB_TABLE || "clientes";

/**
 * Handler invocado pelo Amazon Connect
 * Recebe a intenção identificada pelo Lex e o número do cliente,
 * consulta o DynamoDB e retorna os dados formatados.
 *
 * @param {Object} event - Evento do Contact Flow
 */
exports.handler = async (event) => {
  console.log("Evento recebido:", JSON.stringify(event, null, 2));

  const telefone = event?.Details?.ContactData?.CustomerEndpoint?.Address;
  const intencao = event?.Details?.Parameters?.intencao || "";

  if (!telefone) {
    console.warn("Número de telefone não encontrado no evento");
    return { encontrado: "false", erro: "telefone_ausente" };
  }

  try {
    const command = new GetItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({ telefone }),
    });

    const response = await client.send(command);

    if (!response.Item) {
      console.info(`Cliente não encontrado: ${telefone}`);
      return { encontrado: "false", intencao };
    }

    const cliente = unmarshall(response.Item);
    console.info(`Cliente encontrado: ${cliente.nome} | Intenção: ${intencao}`);

    // Todos os valores devem ser string — Connect não aceita outros tipos
    return {
      encontrado: "true",
      intencao,
      nome:     String(cliente.nome     || ""),
      contrato: String(cliente.contrato || ""),
      status:   String(cliente.status   || ""),
      saldo:    String(cliente.saldo    || "0"),
      plano:    String(cliente.plano    || ""),
    };
  } catch (error) {
    console.error("Erro ao consultar DynamoDB:", error);
    return { encontrado: "false", intencao, erro: "erro_interno" };
  }
};
