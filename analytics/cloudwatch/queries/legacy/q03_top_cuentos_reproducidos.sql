fields @timestamp, @message
| filter @message like /ANALYTICS_EVENT/
| parse @message /"eventName":"(?<nombreEvento>[^"]+)"/
| parse @message /"storyId":"(?<cuentoId>[^"]+)"/
| parse @message /"flowId":"(?<flujoId>[^"]+)"/
| filter nombreEvento="story_started" and ispresent(cuentoId) and ispresent(flujoId)
| stats count_distinct(flujoId) as reproducciones by cuentoId
| fields
    if(cuentoId="cuento-uno", "Cuento uno",
      if(cuentoId="cuento-dos", "Cuento dos",
        if(cuentoId="cuento-tres", "Cuento tres", cuentoId))) as cuento,
    reproducciones
| sort reproducciones desc
| display cuento as `Cuento`, reproducciones as `Reproducciones`
