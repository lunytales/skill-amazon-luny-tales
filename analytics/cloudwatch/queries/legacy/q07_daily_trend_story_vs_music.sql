fields @timestamp, @message
| filter @message like /ANALYTICS_EVENT/
| parse @message /"eventName":"(?<pEventName>[^"]+)"/
| parse @message /"choice":"(?<pChoice>[^"]+)"/
| filter pEventName="choice_selected" and (pChoice="story" or pChoice="music")
| stats count(*) as choices by bin(1d), pChoice
| display bin(1d) as day, pChoice as choice, choices
| sort day asc
