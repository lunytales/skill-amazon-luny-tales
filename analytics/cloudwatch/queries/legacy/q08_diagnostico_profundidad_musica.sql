fields @timestamp, @message
| filter @message like /ANALYTICS_EVENT/
| parse @message /"eventName":"(?<nombreEvento>[^"]+)"/
| parse @message /"flowId":"(?<flujoId>[^"]+)"/
| parse @message /"trackIndex":(?<indicePista>\d+)/
| filter nombreEvento="music_track_enqueued" and ispresent(flujoId)
| stats max(indicePista) as pistas_encoladas_por_sesion by flujoId
| stats
    count(*) as sesiones_de_musica,
    round(avg(pistas_encoladas_por_sesion), 2) as promedio_de_pistas_encoladas,
    pct(pistas_encoladas_por_sesion, 50) as mediana_de_pistas_encoladas,
    pct(pistas_encoladas_por_sesion, 90) as percentil_90_de_pistas_encoladas
| display
    sesiones_de_musica as `Sesiones de musica`,
    promedio_de_pistas_encoladas as `Promedio de pistas encoladas`,
    mediana_de_pistas_encoladas as `Mediana de pistas encoladas`,
    percentil_90_de_pistas_encoladas as `Percentil 90 de pistas encoladas`
