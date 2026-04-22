fields @timestamp, @message
| filter @message like /ANALYTICS_EVENT/
| parse @message /"eventName":"(?<nombreEvento>[^"]+)"/
| parse @message /"storyId":"(?<cuentoId>[^"]+)"/
| parse @message /"flowId":"(?<flujoId>[^"]+)"/
| filter ispresent(cuentoId) and ispresent(flujoId)
| filter nombreEvento in ["story_started", "story_abandon_candidate"]
| stats
    max(if(nombreEvento="story_started", 1, 0)) as inicio,
    max(if(nombreEvento="story_abandon_candidate", 1, 0)) as interrupcion_observada
  by flujoId, cuentoId
| stats
    sum(inicio) as reproducciones,
    sum(interrupcion_observada) as interrupciones_observadas
  by cuentoId
| filter reproducciones > 0
| fields
    if(cuentoId="cuento-uno", "Cuento uno",
      if(cuentoId="cuento-dos", "Cuento dos",
        if(cuentoId="cuento-tres", "Cuento tres", cuentoId))) as cuento,
    reproducciones,
    interrupciones_observadas,
    round((interrupciones_observadas * 100.0) / reproducciones, 2) as tasa_de_interrupcion
| sort tasa_de_interrupcion desc
| display
    cuento as `Cuento`,
    reproducciones as `Reproducciones`,
    interrupciones_observadas as `Interrupciones observadas`,
    tasa_de_interrupcion as `Tasa de interrupcion (%)`
