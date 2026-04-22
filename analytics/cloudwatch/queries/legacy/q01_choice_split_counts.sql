fields @message
| filter @message like /ANALYTICS_EVENT/
| parse @message /"eventName":"(?<pEventName>[^"]+)"/
| parse @message /"choice"\s*:\s*"(?<pChoice>[^"]+)"/
| filter pEventName="choice_selected" and (pChoice="story" or pChoice="music")
| stats count(*) as total by pChoice
| display choice=pChoice, total
| sort total desc
