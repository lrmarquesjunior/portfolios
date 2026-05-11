const https = require("https");
const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");

const secretsClient = new SecretsManagerClient({
  region: process.env.REGION || "us-east-1",
});

const API_BASE_URL = process.env.API_BASE_URL;
const SECRET_NAME = process.env.SECRET_NAME;

/**
 * Busca credenciais da API no Secrets Manager
 */
async function getApiCredentials() {
  const command = new GetSecretValueCommand({ SecretId: SECRET_NAME });
  const response = await secretsClient.send(command);
  return JSON.parse(response.SecretString);
}

/**
 * Faz requisição HTTP para a API externa
 */
function httpGet(url, headers) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ statusCode: res.statusCode, body: data });
        }
      });
    });
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error("Timeout na chamada à API externa"));
    });
    req.on("error", reject);
  });
}

/**
 * Handler invocado pelo Amazon Connect
 */
exports.handler = async (event) => {
  console.log("Evento recebido:", JSON.stringify(event, null, 2));

  const telefone = event?.Details?.ContactData?.CustomerEndpoint?.Address;
  const parametros = event?.Details?.Parameters || {};

  if (!telefone) {
    return { encontrado: "false", erro: "telefone_ausente" };
  }

  try {
    const credentials = await getApiCredentials();

    const url = `${API_BASE_URL}/clientes?telefone=${encodeURIComponent(telefone)}`;
    const response = await httpGet(url, {
      Authorization: `Bearer ${credentials.api_token}`,
      "Content-Type": "application/json",
    });

    if (response.statusCode !== 200 || !response.body) {
      console.warn("Cliente não encontrado na API externa");
      return { encontrado: "false" };
    }

    const cliente = response.body;

    // Todos os valores devem ser string para o Connect
    return {
      encontrado: "true",
      nome: String(cliente.nome || ""),
      contrato: String(cliente.contrato || ""),
      status: String(cliente.status || ""),
      saldo: String(cliente.saldo || "0"),
    };
  } catch (error) {
    console.error("Erro na integração com API externa:", error.message);
    return { encontrado: "false", erro: "erro_integracao" };
  }
};
