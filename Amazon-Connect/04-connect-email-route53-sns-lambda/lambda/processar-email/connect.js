const {
  ConnectClient,
  StartTaskContactCommand,
} = require("@aws-sdk/client-connect");

const connectClient = new ConnectClient({ region: process.env.REGION || "us-east-1" });

const CONNECT_INSTANCE_ID = process.env.CONNECT_INSTANCE_ID;
const CONNECT_FLOW_ID     = process.env.CONNECT_FLOW_ID;   // Contact Flow para Tasks
const CONNECT_QUEUE_ID    = process.env.CONNECT_QUEUE_ID;  // Fila padrão (fallback)

/**
 * Cria uma Task no Amazon Connect associada ao Customer Profile do cliente.
 *
 * Ao passar o CustomerProfileId nos atributos, o Connect vincula automaticamente
 * o contato ao perfil — o agente vê nome, histórico e chamados no CCP.
 *
 * @param {Object} params
 * @param {string} params.remetente       - E-mail do cliente
 * @param {string} params.assunto         - Assunto do e-mail
 * @param {string} params.destinatario    - E-mail de destino (suporte@empresa.com)
 * @param {string} params.nomeCliente     - Nome do cliente (do DynamoDB)
 * @param {string} params.contrato        - Número do contrato
 * @param {string} params.profileId       - ID do Customer Profile no Connect
 * @param {string} params.filaId          - ID da fila (do DynamoDB ou padrão)
 * @param {Array}  params.chamadosAbertos - Lista de chamados em aberto
 * @returns {string} ContactId da Task criada
 */
async function criarTaskComPerfil({
  remetente,
  assunto,
  destinatario,
  nomeCliente,
  contrato,
  profileId,
  filaId,
  chamadosAbertos,
}) {
  // Formata resumo dos chamados em aberto para exibir ao agente
  const resumoChamados = chamadosAbertos.length > 0
    ? chamadosAbertos
        .slice(0, 3) // limita a 3 para não estourar o limite de atributos
        .map((c, i) => `${i + 1}. [${c.chamadoId}] ${c.titulo} (${c.status})`)
        .join(" | ")
    : "Nenhum chamado em aberto";

  const command = new StartTaskContactCommand({
    InstanceId:    CONNECT_INSTANCE_ID,
    ContactFlowId: CONNECT_FLOW_ID,
    QueueId:       filaId || CONNECT_QUEUE_ID,

    // Nome da Task — aparece para o agente no CCP
    Name: `E-mail: ${assunto}`.substring(0, 512),

    // Descrição — aparece no detalhe da Task
    Description: `De: ${remetente} | Para: ${destinatario}`.substring(0, 4096),

    // Atributos de contato — disponíveis no Contact Flow e no CCP
    Attributes: {
      canal:           "EMAIL",
      remetente,
      assunto,
      destinatario,
      nomeCliente,
      contrato,
      profileId,                                    // usado pelo Connect para associar ao Customer Profile
      totalChamadosAbertos: String(chamadosAbertos.length),
      resumoChamados,
    },
  });

  const response = await connectClient.send(command);
  console.info(`Task criada. ContactId: ${response.ContactId} | ProfileId: ${profileId}`);
  return response.ContactId;
}

module.exports = { criarTaskComPerfil };
