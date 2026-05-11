-- Tempo Médio de Atendimento (AHT) por fila
-- Fonte: Contact Trace Records (CTR) do Amazon Connect via Kinesis → S3

SELECT
    queue.name                                          AS fila,
    COUNT(*)                                            AS total_contatos,
    AVG(agentinteractionduration)                       AS aht_segundos,
    AVG(agentinteractionduration) / 60.0                AS aht_minutos,
    MIN(agentinteractionduration)                       AS min_segundos,
    MAX(agentinteractionduration)                       AS max_segundos
FROM
    connect_ctr_database.contact_trace_records
WHERE
    initiationmethod = 'INBOUND'
    AND disconnectreason = 'AGENT_DISCONNECT'
    AND DATE(initiationtimestamp) >= DATE_ADD('day', -30, CURRENT_DATE)
GROUP BY
    queue.name
ORDER BY
    aht_segundos DESC;
