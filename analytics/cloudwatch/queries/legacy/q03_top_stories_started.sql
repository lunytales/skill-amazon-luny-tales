fields @timestamp, @message
| filter @message like /ANALYTICS_EVENT/
| parse @message /"eventName":"(?<pEventName>[^"]+)"/
| parse @message /"storyId":"(?<pStoryId>[^"]+)"/
| parse @message /"flowId":"(?<pFlowId>[^"]+)"/
| filter pEventName="story_started" and ispresent(pStoryId) and ispresent(pFlowId)
| stats count_distinct(pFlowId) as story_plays by pStoryId
| display pStoryId as story_id, story_plays
| sort story_plays desc
