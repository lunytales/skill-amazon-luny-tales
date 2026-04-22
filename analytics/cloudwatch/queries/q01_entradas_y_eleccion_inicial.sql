fields @message
| filter @message like /ANALYTICS_EVENT/
| parse @message /"eventName":"(?<nombreEvento>[^"]+)"/
| parse @message /"choice"\s*:\s*"(?<eleccion>[^"]+)"/
| filter nombreEvento="choice_selected" and (eleccion="story" or eleccion="music")
| stats count(*) as `Elecciones`
  by if(eleccion="story", "Cuento", "Musica") as `Opcion`
| sort `Elecciones` desc
| display `Opcion`, `Elecciones`
