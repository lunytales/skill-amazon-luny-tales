fields @timestamp, @message
| filter @message like /ANALYTICS_EVENT/
| parse @message /"eventName":"(?<nombreEvento>[^"]+)"/
| parse @message /"choice":"(?<eleccion>[^"]+)"/
| filter nombreEvento="choice_selected" and (eleccion="story" or eleccion="music")
| fields if(eleccion="story", "Cuento", "Música") as entrada
| stats count(*) as entradas by bin(1d), entrada
| sort bin(1d) asc
| display bin(1d) as `Dia`, entrada as `Preferencia`, entradas as `Entradas`
