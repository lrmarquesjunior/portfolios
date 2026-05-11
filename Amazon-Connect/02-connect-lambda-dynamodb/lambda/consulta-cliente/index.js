const { DynamoDBClient, GetItemCommand } = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");

const client = new DynamoDBClient({ region: process.env.REGION || "us-east-1" });
const TABLE_NAME = process.env.DYNAMODB_TABLE || "clientes";

/**
 * Handler invocado pelo Amazon Connect
 * @param {Object} event - Evento do Contact Flow
 */
exports.handler = async (event) => {
  console.log("Evento recebido:", JSON.stringify(event, null, 2));

  // Extrai o número de telefone do cliente
  const telefone = event?.Details?.ContactData?.CustomerEndpoint?.Address;

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
      console.info(`Cliente não encontrado para o telefone: ${telefone}`);
      return { encontrado: "false" };
    }

    const cliente = unmarshall(response.Item);
    console.info(`Cliente encontrado: ${cliente.nome}`);

    // Retorna apenas strings — Amazon Connect só aceita string nos atributos
    return {
      encontrado: "true",
      nome: cliente.nome || "",
      contrato: cliente.contrato || "",
      status: cliente.status || "",
      plano: cliente.plano || "",
    };
  } catch (error) {
    console.error("Erro ao consultar DynamoDB:", error);
    return { encontrado: "false", erro: "erro_interno" };
  }
};
