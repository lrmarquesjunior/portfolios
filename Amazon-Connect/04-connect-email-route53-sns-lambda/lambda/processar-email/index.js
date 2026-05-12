const { buscarClientePorEmail, buscarChamadosAbertos } = require("./dynamo");
const { criarTaskComPerfil } = require("./connect");

/**
 * Handler principal — invocado pelo SNS quando o SES recebe um e-mail.
 *
 * Fluxo:
 * 1. Extrai dados do e-mail do evento SNS
 * 2. Busca cliente no DynamoDB pelo e-mail remetente
 * 3. Busca chamados em aberto do cliente
 * 4. Cria Task no Connect associada ao Customer Profile
 *
 * @param {Object} event - Evento SNS com notificação do SES
 */
exports.handler = async (event) => {
  console.log("Evento recebido:", JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    try {
      await processarRegistro(record);
    } catch (error) {
      // Loga o erro mas não relança — evita reprocessamento infinito pelo SNS
      console.error("Erro ao processar registro:", error);
    }
  }
};

async function processarRegistro(record) {
  // Extrai a notificação do SES do payload SNS
  const sesNotification = JSON.parse(record.Sns.Message);
  const mail = sesNotification.mail;

  const remetente    = mail?.source || "";
  const assunto      = mail?.commonHeaders?.subject || "(sem assunto)";
  const destinatario = mail?.destination?.[0] || "";

  if (!remetente) {
    console.warn("E-mail sem remetente identificado — ignorando");
    return;
  }

  console.info(`Processando e-mail | De: ${remetente} | Assunto: ${assunto}`);

  // 1. Busca cliente no DynamoDB
  const cliente = await buscarClientePorEmail(remetente);

  // 2. Busca chamados em aberto (só se cliente encontrado)
  const chamadosAbertos = cliente
    ? await buscarChamadosAbertos(remetente)
    : [];

  if (chamadosAbertos.length > 0) {
    console.info(`Chamados em aberto encontrados: ${chamadosAbertos.length}`);
  }

  // 3. Cria Task no Connect
  // Se cliente não encontrado, cria Task sem profileId — agente atende sem dados
  await criarTaskComPerfil({
    remetente,
    assunto,
    destinatario,
    nomeCliente:     cliente?.nome     || remetente,
    contrato:        cliente?.contrato || "",
    profileId:       cliente?.profileId || "",  // vazio = Connect não associa perfil
    filaId:          cliente?.fila     || "",   // vazio = usa fila padrão da env var
    chamadosAbertos,
  });
}
