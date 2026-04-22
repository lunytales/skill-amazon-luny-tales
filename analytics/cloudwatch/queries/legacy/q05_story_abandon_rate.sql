fields @timestamp, @message
| filter @message like /ANALYTICS_EVENT/
| parse @message /"eventName":"(?<pEventName>[^"]+)"/
| parse @message /"storyId":"(?<pStoryId>[^"]+)"/
| parse @message /"flowId":"(?<pFlowId>[^"]+)"/
| filter ispresent(pStoryId) and ispresent(pFlowId)
| filter pEventName in ["story_started", "story_abandon_candidate"]
| stats
    max(if(pEventName="story_started", 1, 0)) as started,
    max(if(pEventName="story_abandon_candidate", 1, 0)) as abandoned
  by pFlowId, pStoryId
| stats
    sum(started) as starts,
    sum(abandoned) as abandons
  by pStoryId
| filter starts > 0
| display
    pStoryId as story_id,
    starts,
    abandons,
    round((abandons * 100.0) / starts, 2) as abandon_pct
| sort abandon_pct desc
