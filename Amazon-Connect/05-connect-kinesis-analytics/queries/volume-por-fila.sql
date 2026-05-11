-- Volume de contatos por fila e por hora
-- Útil para dimensionamento de equipe e análise de picos

SELECT
    queue.name                                          AS fila,
    DATE(initiationtimestamp)                           AS data,
    HOUR(initiationtimestamp)                           AS hora,
    COUNT(*)                                            AS total_contatos,
    SUM(CASE WHEN disconnectreason = 'CUSTOMER_DISCONNECT' THEN 1 ELSE 0 END) AS abandonados,
    SUM(CASE WHEN agentinteractionduration > 0 THEN 1 ELSE 0 END)             AS atendidos
FROM
    connect_ctr_database.contact_trace_records
WHERE
    initiationmethod = 'INBOUND'
    AND DATE(initiationtimestamp) >= DATE_ADD('day', -7, CURRENT_DATE)
GROUP BY
    queue.name,
    DATE(initiationtimestamp),
    HOUR(initiationtimestamp)
ORDER BY
    data DESC, hora ASC, total_contatos DESC;
