fields @timestamp, @message
| filter @message like /ANALYTICS_EVENT/
| parse @message /"eventName":"(?<nombreEvento>[^"]+)"/
| parse @message /"flowId":"(?<flujoId>[^"]+)"/
| filter ispresent(flujoId)
| filter nombreEvento in ["music_flow_started", "story_started", "story_song_enqueued", "story_flow_completed"]
| stats
    max(if(nombreEvento="music_flow_started", 1, 0)) as hay_musica,
    max(if(nombreEvento="story_started", 1, 0)) as hay_cuento,
    max(if(nombreEvento="story_song_enqueued", 1, 0)) as hay_cierre_musical,
    max(if(nombreEvento="story_flow_completed", 1, 0)) as flujo_de_cuento_completado
  by flujoId
| fields
    if(hay_musica = 1 and hay_cuento = 0, "Solo música",
      if(hay_cuento = 1 and hay_cierre_musical = 0, "Cuento interrumpido antes del cierre musical",
        if(hay_cuento = 1 and hay_cierre_musical = 1 and flujo_de_cuento_completado = 1, "Cuento con cierre musical completado",
          if(hay_cuento = 1 and hay_cierre_musical = 1 and flujo_de_cuento_completado = 0, "Cuento con cierre musical interrumpido", "Otro patron")
        )
      )
    ) as patron_de_uso
| stats count(*) as sesiones by patron_de_uso
| sort sesiones desc
| display patron_de_uso as `Patron de uso`, sesiones as `Sesiones`
