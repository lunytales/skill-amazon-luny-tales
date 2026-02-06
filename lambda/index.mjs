export const handler = async (event) => {
  console.log(JSON.stringify(event));
  const request = event.request;

  const MUSICA_URL = "https://luma-tales-audio.s3.us-east-2.amazonaws.com/m-1.mp3";
  const CUENTOS = [
    "https://luma-tales-audio.s3.us-east-2.amazonaws.com/cuento-uno.mp3",
    "https://luma-tales-audio.s3.us-east-2.amazonaws.com/cuento-dos.mp3",
    "https://luma-tales-audio.s3.us-east-2.amazonaws.com/cuento-tres.mp3"
  ];

  const normalize = (s) =>
    (s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const speak = (text, end = false, repromptText = "Puedes decir cuento o música.") => ({
    version: "1.0",
    response: {
      outputSpeech: { type: "SSML", ssml: `<speak>${text}</speak>` },
      ...(end ? {} : { reprompt: { outputSpeech: { type: "SSML", ssml: `<speak>${repromptText}</speak>` } } }),
      shouldEndSession: end
    }
  });

  const playAudio = (url, text) => ({
    version: "1.0",
    response: {
      outputSpeech: { type: "SSML", ssml: `<speak>${text}</speak>` },
      directives: [
        {
          type: "AudioPlayer.Play",
          playBehavior: "REPLACE_ALL",
          audioItem: {
            stream: {
              token: url,
              url,
              offsetInMilliseconds: 0
            }
          }
        }
      ],
      shouldEndSession: true
    }
  });

  const stopAudio = (text = "Listo, detuve la reproducción.") => ({
    version: "1.0",
    response: {
      outputSpeech: { type: "SSML", ssml: `<speak>${text}</speak>` },
      directives: [{ type: "AudioPlayer.Stop" }],
      shouldEndSession: true
    }
  });

  if (request.type === "LaunchRequest") {
    return speak("Hola. Bienvenido a Cuentos Luny. ¿Quieres escuchar un cuento o música?", false);
  }

  if (request.type === "IntentRequest") {
    const intent = request.intent.name;

    if (["AMAZON.StopIntent", "AMAZON.CancelIntent", "AMAZON.PauseIntent"].includes(intent)) {
      return stopAudio();
    }

    if (intent === "ElegirMusicaIntent") {
      return playAudio(MUSICA_URL, "Muy bien. Disfruta la música.");
    }

    if (intent === "ElegirCuentoIntent") {
      const cuento = CUENTOS[Math.floor(Math.random() * CUENTOS.length)];
      return playAudio(cuento, "Excelente. Comienza el cuento.");
    }

    if (intent === "ElegirAudioIntent") {
      const tipo = normalize(request.intent.slots?.tipo?.value);
      if (tipo.includes("musi")) {
        return playAudio(MUSICA_URL, "Muy bien. Disfruta la música.");
      }
      if (tipo.includes("cuento") || tipo.includes("relato") || tipo.includes("historia")) {
        const cuento = CUENTOS[Math.floor(Math.random() * CUENTOS.length)];
        return playAudio(cuento, "Excelente. Comienza el cuento.");
      }
      return speak("No entendí. Puedes decir cuento o música.", false);
    }
  }

  return speak("No entendí. Puedes decir cuento o música.", false);
};
