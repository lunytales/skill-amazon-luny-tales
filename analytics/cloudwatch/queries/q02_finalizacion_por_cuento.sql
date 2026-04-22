fields @timestamp, @message
| filter @message like /ANALYTICS_EVENT/
| parse @message /"eventName":"(?<nombreEvento>[^"]+)"/
| parse @message /"storyId":"(?<cuentoId>[^"]+)"/
| parse @message /"flowId":"(?<flujoId>[^"]+)"/
| filter ispresent(cuentoId) and ispresent(flujoId)
| filter nombreEvento in ["story_started", "story_completed"]
| stats
    max(if(nombreEvento="story_started", 1, 0)) as inicio,
    max(if(nombreEvento="story_completed", 1, 0)) as finalizado
  by flujoId, cuentoId
| filter inicio = 1
| stats
    sum(inicio) as `Se inicio`,
    sum(finalizado) as `Se termino`,
    round((sum(finalizado) * 100.0) / sum(inicio), 2) as `% que llego al final`
  by if(cuentoId="cuento-uno", "¿Quién vive en la cueva?",
      if(cuentoId="cuento-dos", "Donde florecen los deseos",
        if(cuentoId="cuento-tres", "Lira y la lluvia de risas", cuentoId))) as cuento
| sort `% que llego al final` desc
| display cuento as `Cuento`, `Se inicio`, `Se termino`, `% que llego al final`
