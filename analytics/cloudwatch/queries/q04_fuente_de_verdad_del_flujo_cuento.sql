fields @timestamp, @message
| filter @message like /ANALYTICS_EVENT/
| parse @message /"eventName":"(?<nombreEvento>[^"]+)"/
| parse @message /"flowId":"(?<flujoId>[^"]+)"/
| filter ispresent(flujoId)
| filter nombreEvento in ["story_started", "story_completed", "story_song_playback_started"]
| stats
    max(if(nombreEvento="story_started", 1, 0)) as cuento_iniciado,
    max(if(nombreEvento="story_completed", 1, 0)) as cuento_terminado,
    max(if(nombreEvento="story_song_playback_started", 1, 0)) as paso_a_cancion
  by flujoId
| filter cuento_iniciado = 1
| stats
    sum(cuento_iniciado) as `Cuentos iniciados`,
    sum(cuento_terminado) as `Cuentos terminados`,
    round((sum(cuento_terminado) * 100.0) / sum(cuento_iniciado), 2) as `% de finalizacion`,
    round((sum(paso_a_cancion) * 100.0) / sum(cuento_iniciado), 2) as `% que continuo a la musica`
| filter `Cuentos iniciados` > 0
| display `Cuentos iniciados`, `Cuentos terminados`, `% de finalizacion`, `% que continuo a la musica`
