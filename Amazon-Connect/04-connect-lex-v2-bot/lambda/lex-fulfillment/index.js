/**
 * Lambda de Fulfillment para Amazon Lex V2
 * Invocada após o Lex coletar todos os slots necessários
 */
exports.handler = async (event) => {
  console.log("Evento Lex V2:", JSON.stringify(event, null, 2));

  const intentName = event.sessionState.intent.name;
  const slots = event.sessionState.intent.slots;
  const invocationSource = event.invocationSource; // DialogCodeHook ou FulfillmentCodeHook

  // Roteamento por intenção
  switch (intentName) {
    case "ConsultarSaldo":
      return await handleConsultarSaldo(slots, invocationSource, event);
    case "AgendarAtendimento":
      return await handleAgendarAtendimento(slots, invocationSource, event);
    default:
      return buildResponse(event, "Fulfilled", "Não entendi sua solicitação.");
  }
};

async function handleConsultarSaldo(slots, invocationSource, event) {
  const cpf = slots?.CPF?.value?.interpretedValue;

  if (invocationSource === "DialogCodeHook") {
    // Validação do slot CPF
    if (cpf && !isValidCPF(cpf)) {
      return buildValidationFailure(event, "CPF", "CPF inválido. Por favor, informe um CPF válido.");
    }
    return buildDelegate(event);
  }

  // FulfillmentCodeHook — executa a ação
  // Aqui você consultaria o DynamoDB ou API externa
  return buildResponse(event, "Fulfilled", `Consultando saldo para o CPF ${cpf}. Aguarde.`);
}

async function handleAgendarAtendimento(slots, invocationSource, event) {
  if (invocationSource === "DialogCodeHook") {
    return buildDelegate(event);
  }
  return buildResponse(event, "Fulfilled", "Agendamento realizado com sucesso.");
}

// ---- Helpers ----

function isValidCPF(cpf) {
  return /^\d{11}$/.test(cpf.replace(/\D/g, ""));
}

function buildDelegate(event) {
  return {
    sessionState: {
      ...event.sessionState,
      dialogAction: { type: "Delegate" },
    },
    messages: [],
  };
}

function buildValidationFailure(event, slotName, message) {
  return {
    sessionState: {
      ...event.sessionState,
      dialogAction: {
        type: "ElicitSlot",
        slotToElicit: slotName,
      },
      intent: {
        ...event.sessionState.intent,
        state: "InProgress",
      },
    },
    messages: [{ contentType: "PlainText", content: message }],
  };
}

function buildResponse(event, state, message) {
  return {
    sessionState: {
      ...event.sessionState,
      dialogAction: { type: "Close" },
      intent: {
        ...event.sessionState.intent,
        state,
      },
    },
    messages: [{ contentType: "PlainText", content: message }],
  };
}
