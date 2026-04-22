import { createHash, randomUUID } from "node:crypto";

const ANALYTICS_PREFIX = "ANALYTICS_EVENT";
const ANALYTICS_SCHEMA_VERSION = "1.0";
const DEFAULT_HASH_SALT = "luny-analytics-salt-v1";
const DEFAULT_ANALYTICS_MODE = "cheap";
const CHEAP_EVENT_NAMES = new Set([
  "choice_selected",
  "story_started",
  "story_completed",
  "story_song_playback_started"
]);

const toNumber = (value) => {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const hashValue = (value, salt) => {
  if (!value) return null;
  return createHash("sha256").update(`${salt}:${value}`).digest("hex");
};

const inferSource = (event, tokenData, explicitSource) => {
  if (explicitSource) return explicitSource;
  if (tokenData?.source) return tokenData.source;

  const type = event?.request?.type;
  if (type === "Alexa.Presentation.APL.UserEvent") return "widget";
  if (type === "LaunchRequest" || type === "IntentRequest") return "voice";
  if (type?.startsWith("AudioPlayer.")) return "audio_player";
  return "unknown";
};

const inferContentType = (tokenData, explicitContentType) => {
  if (explicitContentType) return explicitContentType;
  if (!tokenData) return null;

  if (tokenData.mode === "music") return "music_track";
  if (tokenData.mode === "story" && tokenData.step === "cuento") return "story";
  if (tokenData.mode === "story" && tokenData.step === "cancion") return "story_song";
  return null;
};

const inferContentId = (tokenData, explicitContentId) => {
  if (explicitContentId) return explicitContentId;
  if (!tokenData) return null;

  if (tokenData.mode === "music") return tokenData.trackId ?? null;
  if (tokenData.mode === "story" && tokenData.step === "cuento") return tokenData.storyId ?? null;
  if (tokenData.mode === "story" && tokenData.step === "cancion") return tokenData.trackId ?? null;
  return null;
};

const getLocale = (event) =>
  event?.request?.locale ??
  event?.context?.System?.device?.locale ??
  null;

const getUserHash = (event, salt) =>
  hashValue(event?.context?.System?.user?.userId ?? null, salt);

const cleanPayload = (obj) => {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
};

const getAnalyticsMode = () => (process.env.ANALYTICS_MODE ?? DEFAULT_ANALYTICS_MODE).toLowerCase();

const shouldEmitEvent = (mode, eventName) => {
  if (!eventName) return false;
  if (mode === "off") return false;
  if (mode === "full") return true;
  return CHEAP_EVENT_NAMES.has(eventName);
};

const buildCheapPayload = (eventName, options = {}) => {
  const tokenData = options.tokenData ?? null;
  const stage = process.env.SKILL_STAGE ?? process.env.STAGE ?? "unknown";

  if (eventName === "choice_selected") {
    return cleanPayload({
      schemaVersion: ANALYTICS_SCHEMA_VERSION,
      eventName,
      stage,
      choice: options.choice ?? null
    });
  }

  if (eventName === "story_started" || eventName === "story_completed") {
    return cleanPayload({
      schemaVersion: ANALYTICS_SCHEMA_VERSION,
      eventName,
      stage,
      flowId: tokenData?.flowId ?? options.flowId ?? null,
      storyId: tokenData?.storyId ?? options.storyId ?? null
    });
  }

  if (eventName === "story_song_playback_started") {
    return cleanPayload({
      schemaVersion: ANALYTICS_SCHEMA_VERSION,
      eventName,
      stage,
      flowId: tokenData?.flowId ?? options.flowId ?? null
    });
  }

  return cleanPayload({
    schemaVersion: ANALYTICS_SCHEMA_VERSION,
    eventName,
    stage
  });
};

export const createFlowId = () => randomUUID();
export const createPlaybackId = () => randomUUID();

export const emitAnalytics = (event, eventName, options = {}) => {
  const enabled = (process.env.ANALYTICS_ENABLED ?? "true").toLowerCase() !== "false";
  if (!enabled) return;

  try {
    const analyticsMode = getAnalyticsMode();
    if (!shouldEmitEvent(analyticsMode, eventName)) return;

    if (analyticsMode !== "full") {
      const payload = buildCheapPayload(eventName, options);
      console.log(`${ANALYTICS_PREFIX} ${JSON.stringify(payload)}`);
      return;
    }

    const request = event?.request ?? {};
    const tokenData = options.tokenData ?? null;
    const hashSalt = process.env.ANALYTICS_SALT ?? DEFAULT_HASH_SALT;

    const payload = cleanPayload({
      schemaVersion: ANALYTICS_SCHEMA_VERSION,
      eventName,
      emittedAt: new Date().toISOString(),
      requestTimestamp: request.timestamp ?? null,
      requestType: request.type ?? null,
      requestId: request.requestId ?? null,
      locale: getLocale(event),
      skillId: event?.context?.System?.application?.applicationId ?? null,
      stage: process.env.SKILL_STAGE ?? process.env.STAGE ?? "unknown",

      userHash: getUserHash(event, hashSalt),
      sessionId: event?.session?.sessionId ?? null,
      source: inferSource(event, tokenData, options.source),

      flowId: tokenData?.flowId ?? options.flowId ?? null,
      playbackId: tokenData?.playbackId ?? options.playbackId ?? null,
      parentPlaybackId: tokenData?.parentPlaybackId ?? options.parentPlaybackId ?? null,
      mode: tokenData?.mode ?? options.mode ?? null,
      sequenceType: options.sequenceType ?? tokenData?.sequenceType ?? null,

      contentType: inferContentType(tokenData, options.contentType),
      contentId: inferContentId(tokenData, options.contentId),
      storyId: tokenData?.storyId ?? options.storyId ?? null,
      trackId: tokenData?.trackId ?? options.trackId ?? null,
      step: tokenData?.step ?? options.step ?? null,
      trackIndex: toNumber(options.trackIndex ?? tokenData?.trackIndex),

      offsetMs: toNumber(request.offsetInMilliseconds),
      remainingMs: toNumber(options.remainingMs ?? tokenData?.remainingMs),
      listenedMs: toNumber(options.listenedMs),

      choice: options.choice ?? null,
      controlType: options.controlType ?? null,
      status: options.status ?? null,
      stopReason: options.stopReason ?? null,

      metadata: options.metadata ?? null
    });

    console.log(`${ANALYTICS_PREFIX} ${JSON.stringify(payload)}`);
  } catch (error) {
    const fallback = {
      schemaVersion: ANALYTICS_SCHEMA_VERSION,
      eventName: "analytics_emit_error",
      emittedAt: new Date().toISOString(),
      error: error?.message ?? "unknown_error"
    };
    console.log(`${ANALYTICS_PREFIX} ${JSON.stringify(fallback)}`);
  }
};
