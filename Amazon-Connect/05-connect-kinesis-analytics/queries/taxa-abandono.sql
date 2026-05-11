-- Taxa de Abandono por fila (últimos 30 dias)
-- Abandono = cliente desligou antes de ser atendido por agente

SELECT
    queue.name                                                          AS fila,
    COUNT(*)                                                            AS total_contatos,
    SUM(CASE WHEN agentinteractionduration = 0 THEN 1 ELSE 0 END)      AS abandonados,
    ROUND(
        100.0 * SUM(CASE WHEN agentinteractionduration = 0 THEN 1 ELSE 0 END) / COUNT(*),
        2
    )                                                                   AS taxa_abandono_pct,
    AVG(customerholdduration)                                           AS tempo_medio_espera_seg
FROM
    connect_ctr_database.contact_trace_records
WHERE
    initiationmethod = 'INBOUND'
    AND DATE(initiationtimestamp) >= DATE_ADD('day', -30, CURRENT_DATE)
GROUP BY
    queue.name
ORDER BY
    taxa_abandono_pct DESC;
