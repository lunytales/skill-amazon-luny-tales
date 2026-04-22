fields @timestamp, @message
| filter @message like /ANALYTICS_EVENT/
| parse @message /"eventName":"(?<pEventName>[^"]+)"/
| parse @message /"flowId":"(?<pFlowId>[^"]+)"/
| parse @message /"trackIndex":(?<pTrackIndex>\d+)/
| filter pEventName="music_track_enqueued" and ispresent(pFlowId)
| stats max(pTrackIndex) as max_track_index by pFlowId
| stats
    count(*) as music_flows,
    avg(max_track_index) as avg_tracks_per_flow,
    pct(max_track_index, 50) as p50_tracks,
    pct(max_track_index, 90) as p90_tracks
