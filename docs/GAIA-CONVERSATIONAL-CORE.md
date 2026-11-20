# GAIA Conversational Core

## Purpose

The HyperTerminal UI remains a terminal-capable interface, but its model is a
general conversational assistant. It must not answer every message as a shell
command, status banner, or synthetic system event.

The server builds the stable GAIA interaction contract from
`src/services/gaiaPersona.mjs`. Gemini generates the actual language response;
the server only supplies conversation history, optional retrieved evidence,
and the visual metadata schema.

## Runtime configuration

Set these values in the server environment or deployment secret manager:

```dotenv
GEMINI_API_KEY=replace-with-a-real-provider-key
GEMINI_MODEL=gemini-2.5-flash
PORT=3000
```

Never commit real keys. The model defaults to `gemini-2.5-flash` if
`GEMINI_MODEL` is unset. The configured model name is returned in runtime
responses so the UI can identify the actual provider/model.

## Conversation behavior

- Natural multi-turn conversation is the default.
- The last 12 valid user/assistant turns are passed as history.
- Each history message is capped at 6,000 characters.
- Retrieved memory is capped at 4,000 characters and marked untrusted.
- A missing provider key returns `AI_NOT_CONFIGURED`; provider failures return
  `AI_PROVIDER_ERROR`. Neither condition is disguised as a successful AI
  answer by a deterministic phrase generator.
- The API key pool remains server-side. No secret is returned to the browser.

## Verification

Run:

```sh
node --test tests/gaia-persona.test.mjs
npm run lint
npm run build
```

The unit test validates persona construction and memory-boundary language.
Build/lint and live inference still require execution in the repository's
actual CI/runtime with a configured provider key. A green unit test alone does
not establish provider connectivity.
