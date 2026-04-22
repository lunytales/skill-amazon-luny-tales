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
    sum(cuento_terminado) as cuentos_terminados,
    sum(if(cuento_terminado = 1 and paso_a_cancion = 1, 1, 0)) as pasaron_a_cancion
| filter cuentos_terminados > 0
| fields
    cuentos_terminados as `Cuentos terminados`,
    pasaron_a_cancion as `Pasaron a cancion`,
    round((pasaron_a_cancion * 100.0) / cuentos_terminados, 2) as `% que continuo a la musica`
| display `Cuentos terminados`, `Pasaron a cancion`, `% que continuo a la musica`
