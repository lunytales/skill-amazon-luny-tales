fields @timestamp, @message
| filter @message like /ANALYTICS_EVENT/
| parse @message /"eventName":"(?<pEventName>[^"]+)"/
| parse @message /"storyId":"(?<pStoryId>[^"]+)"/
| parse @message /"flowId":"(?<pFlowId>[^"]+)"/
| filter ispresent(pStoryId) and ispresent(pFlowId)
| filter pEventName in ["story_started", "story_completed"]
| stats
    max(if(pEventName="story_started", 1, 0)) as started,
    max(if(pEventName="story_completed", 1, 0)) as completed
  by pFlowId, pStoryId
| stats
    sum(started) as starts,
    sum(completed) as completes
  by pStoryId
| filter starts > 0
| display
    pStoryId as story_id,
    starts,
    completes,
    round((completes * 100.0) / starts, 2) as completion_pct
| sort completion_pct asc
