fields @message
| filter @message like /ANALYTICS_EVENT/
| parse @message /"eventName":"(?<nombreEvento>[^"]+)"/
| parse @message /"choice"\s*:\s*"(?<eleccion>[^"]+)"/
| filter nombreEvento="choice_selected" and (eleccion="story" or eleccion="music")
| fields if(eleccion="story", "Cuento", "Musica") as opcion
| stats count(*) as entradas by opcion
| sort entradas desc
| display opcion as `Preferencia`, entradas as `Entradas`
