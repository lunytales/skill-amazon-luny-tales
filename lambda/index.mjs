import { createFlowId, createPlaybackId, emitAnalytics } from "./analytics.mjs";

export const handler = async (event) => {
  const rawEventLoggingEnabled = (process.env.RAW_EVENT_LOG_ENABLED ?? "false").toLowerCase() === "true";
  if (rawEventLoggingEnabled) {
    console.log(JSON.stringify(event));
  }
  const request = event?.request ?? {};

  const BASE = "https://luma-tales-audio.s3.us-east-2.amazonaws.com";
  const TARGET_MS = 20 * 60 * 1000;
  const DEFAULT_TRACK_MS = 3 * 60 * 1000;

  const STORIES = [
    { id: "cuento-uno", url: `${BASE}/cuento-uno.mp3`, songId: "m-1" },
    { id: "cuento-dos", url: `${BASE}/cuento-dos.mp3`, songId: "m-2" },
    { id: "cuento-tres", url: `${BASE}/cuento-tres.mp3`, songId: "m-3" }
  ];

  const MUSIC_TRACKS = [
    { id: "m-1", url: `${BASE}/m-1.mp3`, ms: 228911 },
    { id: "m-2", url: `${BASE}/m-2.mp3`, ms: 224470 },
    { id: "m-3", url: `${BASE}/m-3.mp3`, ms: 233718 },
    { id: "m-4", url: `${BASE}/m-4.mp3`, ms: 157597 },
    { id: "m-5", url: `${BASE}/m-5.mp3`, ms: 227422 },
    { id: "m-6", url: `${BASE}/m-6.mp3`, ms: 233613 },
    { id: "m-7", url: `${BASE}/m-7.mp3`, ms: 233796 },
    { id: "m-8", url: `${BASE}/m-8.mp3`, ms: 150152 }
  ];

  const MUSIC_BY_ID = new Map(MUSIC_TRACKS.map((t) => [t.id, t]));
  const STORY_BY_ID = new Map(STORIES.map((s) => [s.id, s]));

  const normalize = (s) =>
    (s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const getSlotTipoValue = (intent) => {
    const slot = intent?.slots?.tipo;
    if (!slot) return "";

    if (typeof slot.value === "string" && slot.value.trim()) {
      return slot.value;
    }

    const resolution = slot.resolutions?.resolutionsPerAuthority?.find(
      (entry) => entry?.status?.code === "ER_SUCCESS_MATCH" && entry?.values?.[0]?.value?.name
    );

    return resolution?.values?.[0]?.value?.name ?? "";
  };

  const speak = (text, end = false, repromptText = "¿Sigues ahí? Elige: cuento o música.") => ({
    version: "1.0",
    response: {
      outputSpeech: { type: "SSML", ssml: `<speak>${text}</speak>` },
      ...(end
        ? {}
        : { reprompt: { outputSpeech: { type: "SSML", ssml: `<speak>${repromptText}</speak>` } } }),
      shouldEndSession: end
    }
  });

  const playAudio = (url, token, text = null) => {
    const response = {
      directives: [
        {
          type: "AudioPlayer.Play",
          playBehavior: "REPLACE_ALL",
          audioItem: {
            stream: {
              token,
              url,
              offsetInMilliseconds: 0
            }
          }
        }
      ],
      shouldEndSession: true
    };

    if (text) {
      response.outputSpeech = { type: "SSML", ssml: `<speak>${text}</speak>` };
    }

    return {
      version: "1.0",
      response
    };
  };

  const enqueueAudio = (url, token, expectedPreviousToken) => ({
    version: "1.0",
    response: {
      directives: [
        {
          type: "AudioPlayer.Play",
          playBehavior: "ENQUEUE",
          audioItem: {
            stream: {
              token,
              url,
              offsetInMilliseconds: 0,
              expectedPreviousToken
            }
          }
        }
      ],
      shouldEndSession: true
    }
  });

  const stopAudio = (text = "Hecho.") => ({
    version: "1.0",
    response: {
      outputSpeech: { type: "SSML", ssml: `<speak>${text}</speak>` },
      directives: [{ type: "AudioPlayer.Stop" }],
      shouldEndSession: true
    }
  });

  const emptyResponse = () => ({
    version: "1.0",
    response: {
      shouldEndSession: true
    }
  });

  const encodeToken = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url");
  const decodeToken = (token) => {
    try {
      if (!token) return null;
      return JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
    } catch {
      return null;
    }
  };

  const randomItem = (list, excludeId) => {
    if (list.length === 1) return list[0];
    let item = list[Math.floor(Math.random() * list.length)];
    if (excludeId && item.id === excludeId) {
      item = list[Math.floor(Math.random() * list.length)];
    }
    return item;
  };

  const getMusicDurationMs = (trackId) => MUSIC_BY_ID.get(trackId)?.ms ?? DEFAULT_TRACK_MS;
  const getContextTokenData = () => decodeToken(event?.context?.AudioPlayer?.token);

  const emit = (eventName, options = {}) => {
    emitAnalytics(event, eventName, options);
  };

  const startMusic = ({ silent = false, source = "voice", triggerIntent = null } = {}) => {
    const first = randomItem(MUSIC_TRACKS);
    const tokenData = {
      mode: "music",
      sequenceType: "music_only",
      source,
      flowId: createFlowId(),
      playbackId: createPlaybackId(),
      trackId: first.id,
      trackIndex: 1,
      remainingMs: TARGET_MS
    };

    emit("music_flow_started", {
      tokenData,
      status: "started",
      metadata: { triggerIntent }
    });

    emit("music_started", {
      tokenData,
      status: "directive_sent",
      metadata: { triggerIntent }
    });

    const token = encodeToken(tokenData);
    return playAudio(first.url, token, silent ? null : "Perfecto. Empieza la música.");
  };

  const startStory = ({ silent = false, source = "voice", triggerIntent = null } = {}) => {
    const story = randomItem(STORIES);
    const tokenData = {
      mode: "story",
      sequenceType: "story_plus_song",
      source,
      flowId: createFlowId(),
      playbackId: createPlaybackId(),
      storyId: story.id,
      step: "cuento",
      trackIndex: 1
    };

    emit("story_flow_started", {
      tokenData,
      status: "started",
      metadata: { triggerIntent }
    });

    emit("story_started", {
      tokenData,
      status: "directive_sent",
      metadata: { triggerIntent }
    });

    const token = encodeToken(tokenData);
    return playAudio(story.url, token, silent ? null : "Me encanta. Que empiece el cuento.");
  };

  const handleIntentByName = (intentName, opts = {}) => {
    const { fromWidget = false, slotTipo = "" } = opts;
    const source = fromWidget ? "widget" : "voice";

    if (["AMAZON.StopIntent", "AMAZON.CancelIntent", "AMAZON.PauseIntent"].includes(intentName)) {
      const controlType = intentName.replace("AMAZON.", "").replace("Intent", "").toLowerCase();
      emit("playback_control_requested", {
        tokenData: getContextTokenData(),
        source,
        controlType,
        status: "requested",
        stopReason: `user_${controlType}`
      });
      return stopAudio();
    }

    if (intentName === "PlayMusicIntent") {
      emit("choice_selected", { source, choice: "music", status: "recognized" });
      return startMusic({ silent: fromWidget, source, triggerIntent: intentName });
    }

    if (intentName === "PlayStoryIntent") {
      emit("choice_selected", { source, choice: "story", status: "recognized" });
      return startStory({ silent: fromWidget, source, triggerIntent: intentName });
    }

    if (intentName === "ElegirAudioIntent") {
      const tipo = normalize(slotTipo);
      if (tipo.includes("musi")) {
        emit("choice_selected", { source, choice: "music", status: "recognized" });
        return startMusic({ silent: false, source, triggerIntent: intentName });
      }
      if (tipo.includes("cuento") || tipo.includes("relato") || tipo.includes("historia")) {
        emit("choice_selected", { source, choice: "story", status: "recognized" });
        return startStory({ silent: false, source, triggerIntent: intentName });
      }

      emit("choice_selected", { source, choice: "unknown", status: "unrecognized" });
      return speak("Lo siento, no te entendí. ¿Prefieres cuento o música?", false);
    }

    return fromWidget ? emptyResponse() : speak("Lo siento, no te entendí. ¿Prefieres cuento o música?", false);
  };

  if (request.type === "AudioPlayer.PlaybackNearlyFinished") {
    const tokenData = decodeToken(request.token);
    if (!tokenData) return emptyResponse();

    if (tokenData.mode === "story" && tokenData.step === "cuento") {
      const story = STORY_BY_ID.get(tokenData.storyId);
      const song = story ? MUSIC_BY_ID.get(story.songId) : null;
      if (!song) return emptyResponse();

      const nextTokenData = {
        ...tokenData,
        playbackId: createPlaybackId(),
        parentPlaybackId: tokenData.playbackId,
        step: "cancion",
        trackId: song.id,
        trackIndex: 2
      };
      const nextToken = encodeToken(nextTokenData);

      emit("story_song_enqueued", {
        tokenData: nextTokenData,
        status: "queued"
      });

      return enqueueAudio(song.url, nextToken, request.token);
    }

    if (tokenData.mode === "music") {
      const currentMs = getMusicDurationMs(tokenData.trackId);
      const remainingAfter = (tokenData.remainingMs ?? TARGET_MS) - currentMs;

      if (remainingAfter <= 0) {
        emit("music_flow_nearly_completed", {
          tokenData,
          remainingMs: 0,
          listenedMs: currentMs,
          status: "completion_scheduled"
        });
        return emptyResponse();
      }

      const next = randomItem(MUSIC_TRACKS, tokenData.trackId);
      const nextTokenData = {
        ...tokenData,
        playbackId: createPlaybackId(),
        parentPlaybackId: tokenData.playbackId,
        trackId: next.id,
        trackIndex: (tokenData.trackIndex ?? 1) + 1,
        remainingMs: remainingAfter
      };
      const nextToken = encodeToken(nextTokenData);

      emit("music_track_enqueued", {
        tokenData: nextTokenData,
        remainingMs: remainingAfter,
        status: "queued"
      });

      return enqueueAudio(next.url, nextToken, request.token);
    }

    return emptyResponse();
  }

  if (request.type === "AudioPlayer.PlaybackStarted") {
    const tokenData = decodeToken(request.token);
    if (!tokenData) return emptyResponse();

    emit("playback_started", {
      tokenData,
      status: "started"
    });

    if (tokenData.mode === "story" && tokenData.step === "cuento") {
      emit("story_playback_started", { tokenData, status: "started" });
    } else if (tokenData.mode === "story" && tokenData.step === "cancion") {
      emit("story_song_playback_started", { tokenData, status: "started" });
    } else if (tokenData.mode === "music") {
      emit("music_track_playback_started", { tokenData, status: "started" });
    }

    return emptyResponse();
  }

  if (request.type === "AudioPlayer.PlaybackFinished") {
    const tokenData = decodeToken(request.token);
    if (!tokenData) return emptyResponse();

    emit("playback_finished", {
      tokenData,
      status: "completed"
    });

    if (tokenData.mode === "story" && tokenData.step === "cuento") {
      emit("story_completed", {
        tokenData,
        status: "completed"
      });
    } else if (tokenData.mode === "story" && tokenData.step === "cancion") {
      emit("story_song_completed", {
        tokenData,
        status: "completed"
      });
      emit("story_flow_completed", {
        tokenData,
        status: "completed"
      });
    } else if (tokenData.mode === "music") {
      const currentMs = getMusicDurationMs(tokenData.trackId);
      const remainingAfter = (tokenData.remainingMs ?? TARGET_MS) - currentMs;

      emit("music_track_completed", {
        tokenData,
        listenedMs: currentMs,
        remainingMs: Math.max(remainingAfter, 0),
        status: "completed"
      });

      if (remainingAfter <= 0) {
        emit("music_flow_completed", {
          tokenData,
          listenedMs: currentMs,
          remainingMs: 0,
          status: "completed"
        });
      }
    }

    return emptyResponse();
  }

  if (request.type === "AudioPlayer.PlaybackStopped") {
    const tokenData = decodeToken(request.token);
    if (!tokenData) return emptyResponse();

    emit("playback_stopped", {
      tokenData,
      listenedMs: request.offsetInMilliseconds,
      status: "stopped",
      stopReason: "unknown"
    });

    if (tokenData.mode === "story" && tokenData.step === "cuento") {
      emit("story_abandon_candidate", {
        tokenData,
        listenedMs: request.offsetInMilliseconds,
        status: "abandon_candidate",
        stopReason: "unknown"
      });
    } else if (tokenData.mode === "story" && tokenData.step === "cancion") {
      emit("story_song_abandon_candidate", {
        tokenData,
        listenedMs: request.offsetInMilliseconds,
        status: "abandon_candidate",
        stopReason: "unknown"
      });
      emit("story_flow_abandon_candidate", {
        tokenData,
        listenedMs: request.offsetInMilliseconds,
        status: "abandon_candidate",
        stopReason: "unknown"
      });
    } else if (tokenData.mode === "music") {
      emit("music_track_abandon_candidate", {
        tokenData,
        listenedMs: request.offsetInMilliseconds,
        status: "abandon_candidate",
        stopReason: "unknown"
      });
      emit("music_flow_abandon_candidate", {
        tokenData,
        listenedMs: request.offsetInMilliseconds,
        status: "abandon_candidate",
        stopReason: "unknown"
      });
    }

    return emptyResponse();
  }

  if (request.type === "AudioPlayer.PlaybackFailed") {
    const tokenData = decodeToken(request.token);
    emit("playback_failed", {
      tokenData,
      status: "failed",
      stopReason: "playback_failed",
      metadata: {
        errorType: request.error?.type ?? null,
        errorMessage: request.error?.message ?? null
      }
    });

    if (tokenData?.mode === "story") {
      emit("story_flow_abandon_candidate", {
        tokenData,
        status: "abandon_candidate",
        stopReason: "playback_failed"
      });
    } else if (tokenData?.mode === "music") {
      emit("music_flow_abandon_candidate", {
        tokenData,
        status: "abandon_candidate",
        stopReason: "playback_failed"
      });
    }

    return emptyResponse();
  }

  if (request.type === "Alexa.Presentation.APL.UserEvent") {
    const action = request.arguments?.[0];
    if (action?.action === "launchIntent" && typeof action.intentName === "string") {
      emit("widget_intent_launch", {
        source: "widget",
        status: "requested",
        metadata: { intentName: action.intentName }
      });
      return handleIntentByName(action.intentName, { fromWidget: true });
    }
    return emptyResponse();
  }

  if (request.type === "LaunchRequest") {
    emit("skill_opened", {
      source: "voice",
      status: "opened"
    });
    return speak("¡Hola! Soy Luny. ¿Qué te apetece hoy: cuento o música?", false);
  }

  if (request.type === "IntentRequest") {
    const intent = request.intent?.name;
    const slotTipo = getSlotTipoValue(request.intent);

    emit("intent_received", {
      source: "voice",
      status: "received",
      metadata: {
        intentName: intent ?? null,
        slotTipo: slotTipo || null
      }
    });

    return handleIntentByName(intent, { fromWidget: false, slotTipo });
  }

  if (request.type === "SessionEndedRequest") {
    emit("session_ended", {
      source: "voice",
      status: "ended",
      stopReason: request.reason ?? "unknown",
      metadata: {
        reason: request.reason ?? null,
        errorType: request.error?.type ?? null,
        errorMessage: request.error?.message ?? null
      }
    });
    return emptyResponse();
  }

  return speak("Lo siento, no te entendí. ¿Prefieres cuento o música?", false);
};
