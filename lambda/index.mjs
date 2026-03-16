export const handler = async (event) => {
  console.log(JSON.stringify(event));
  const request = event.request;

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

  const normalize = (s) =>
    (s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

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

  const startMusic = ({ silent = false } = {}) => {
    const first = randomItem(MUSIC_TRACKS);
    const token = encodeToken({
      mode: "music",
      remainingMs: TARGET_MS,
      trackId: first.id
    });
    return playAudio(first.url, token, silent ? null : "Perfecto. Empieza la música.");
  };

  const startStory = ({ silent = false } = {}) => {
    const story = randomItem(STORIES);
    const token = encodeToken({
      mode: "story",
      storyId: story.id,
      step: "cuento"
    });
    return playAudio(story.url, token, silent ? null : "Me encanta. Que empiece el cuento.");
  };

  const handleIntentByName = (intentName, opts = {}) => {
    const { fromWidget = false, slotTipo = "" } = opts;

    if (["AMAZON.StopIntent", "AMAZON.CancelIntent", "AMAZON.PauseIntent"].includes(intentName)) {
      return stopAudio();
    }

    if (intentName === "PlayMusicIntent") {
      return startMusic({ silent: fromWidget });
    }

    if (intentName === "PlayStoryIntent") {
      return startStory({ silent: fromWidget });
    }

    if (intentName === "ElegirAudioIntent") {
      const tipo = normalize(slotTipo);
      if (tipo.includes("musi")) {
        return startMusic({ silent: false });
      }
      if (tipo.includes("cuento") || tipo.includes("relato") || tipo.includes("historia")) {
        return startStory({ silent: false });
      }
      return speak("Lo siento, no te entendí. ¿Prefieres cuento o música?", false);
    }

    return fromWidget ? emptyResponse() : speak("Lo siento, no te entendí. ¿Prefieres cuento o música?", false);
  };

  if (request.type === "AudioPlayer.PlaybackNearlyFinished") {
    const tokenData = decodeToken(request.token);
    if (!tokenData) return emptyResponse();

    if (tokenData.mode === "story" && tokenData.step === "cuento") {
      const story = STORIES.find((s) => s.id === tokenData.storyId);
      const song = story ? MUSIC_BY_ID.get(story.songId) : null;
      if (!song) return emptyResponse();

      const nextToken = encodeToken({
        mode: "story",
        storyId: story.id,
        step: "cancion"
      });
      return enqueueAudio(song.url, nextToken, request.token);
    }

    if (tokenData.mode === "music") {
      const current = MUSIC_BY_ID.get(tokenData.trackId);
      const currentMs = current?.ms ?? DEFAULT_TRACK_MS;
      const remainingAfter = (tokenData.remainingMs ?? TARGET_MS) - currentMs;

      if (remainingAfter <= 0) {
        return emptyResponse();
      }

      const next = randomItem(MUSIC_TRACKS, tokenData.trackId);
      const nextToken = encodeToken({
        mode: "music",
        remainingMs: remainingAfter,
        trackId: next.id
      });
      return enqueueAudio(next.url, nextToken, request.token);
    }

    return emptyResponse();
  }

  if (
    request.type === "AudioPlayer.PlaybackFinished" ||
    request.type === "AudioPlayer.PlaybackStopped" ||
    request.type === "AudioPlayer.PlaybackStarted"
  ) {
    return emptyResponse();
  }

  if (request.type === "Alexa.Presentation.APL.UserEvent") {
    const action = request.arguments?.[0];
    if (action?.action === "launchIntent" && typeof action.intentName === "string") {
      return handleIntentByName(action.intentName, { fromWidget: true });
    }
    return emptyResponse();
  }

  if (request.type === "LaunchRequest") {
    return speak("¡Hola! Soy Luny. ¿Qué te apetece hoy: cuento o música?", false);
  }

  if (request.type === "IntentRequest") {
    const intent = request.intent.name;
    const slotTipo = request.intent.slots?.tipo?.value || "";
    return handleIntentByName(intent, { fromWidget: false, slotTipo });
  }

  return speak("Lo siento, no te entendí. ¿Prefieres cuento o música?", false);
};
