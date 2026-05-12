const { DynamoDBClient, GetItemCommand, QueryCommand } = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");

const client = new DynamoDBClient({ region: process.env.REGION || "us-east-1" });

const TABELA_CLIENTES = process.env.DYNAMODB_TABLE_CLIENTES || "clientes";
const TABELA_CHAMADOS = process.env.DYNAMODB_TABLE_CHAMADOS || "chamados";

/**
 * Busca cliente na tabela "clientes" pelo e-mail remetente.
 * Retorna profileId, nome, contrato, fila e demais dados.
 *
 * @param {string} email
 * @returns {Object|null}
 */
async function buscarClientePorEmail(email) {
  try {
    const command = new GetItemCommand({
      TableName: TABELA_CLIENTES,
      Key: marshall({ email }),
    });

    const response = await client.send(command);

    if (!response.Item) {
      console.info(`Cliente não encontrado para o e-mail: ${email}`);
      return null;
    }

    return unmarshall(response.Item);
  } catch (error) {
    console.error("Erro ao buscar cliente no DynamoDB:", error.message);
    return null;
  }
}

/**
 * Busca chamados em aberto do cliente na tabela "chamados".
 * Retorna lista de chamados com status "aberto" ou "em_andamento".
 *
 * @param {string} clienteEmail
 * @returns {Array}
 */
async function buscarChamadosAbertos(clienteEmail) {
  try {
    const command = new QueryCommand({
      TableName: TABELA_CHAMADOS,
      KeyConditionExpression: "clienteEmail = :email",
      FilterExpression: "#s IN (:aberto, :em_andamento)",
      ExpressionAttributeNames: {
        "#s": "status", // "status" é palavra reservada no DynamoDB
      },
      ExpressionAttributeValues: marshall({
        ":email":        clienteEmail,
        ":aberto":       "aberto",
        ":em_andamento": "em_andamento",
      }),
    });

    const response = await client.send(command);
    return (response.Items || []).map(unmarshall);
  } catch (error) {
    console.error("Erro ao buscar chamados no DynamoDB:", error.message);
    return [];
  }
}

module.exports = { buscarClientePorEmail, buscarChamadosAbertos };
