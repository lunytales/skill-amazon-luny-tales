fields @timestamp, @message
| filter @message like /ANALYTICS_EVENT/
| parse @message /"eventName":"(?<pEventName>[^"]+)"/
| parse @message /"flowId":"(?<pFlowId>[^"]+)"/
| filter ispresent(pFlowId)
| filter pEventName in ["music_flow_started", "story_started", "story_song_enqueued", "story_flow_completed"]
| stats
    max(if(pEventName="music_flow_started", 1, 0)) as music_flow,
    max(if(pEventName="story_started", 1, 0)) as story_flow,
    max(if(pEventName="story_song_enqueued", 1, 0)) as song_enqueued,
    max(if(pEventName="story_flow_completed", 1, 0)) as story_flow_completed
  by pFlowId
| display
    if(music_flow = 1 and story_flow = 0, "musica",
      if(story_flow = 1 and song_enqueued = 0, "cuento_solo",
        if(story_flow = 1 and song_enqueued = 1 and story_flow_completed = 1, "cuento_mas_musica_completo",
          if(story_flow = 1 and song_enqueued = 1 and story_flow_completed = 0, "cuento_mas_musica_parcial", "otro")
        )
      )
    ) as usage_pattern
| stats count(*) as total_flows by usage_pattern
| sort total_flows desc
