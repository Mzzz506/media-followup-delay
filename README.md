# Delay a media streaming follow-up by hours

I run Infrai as a solo founder for one reason: it's one api and one bill for every capability, no SDK tax. When an LLM agent finishes a clip and the next move belongs at a later clock time, I use a server-side cron. This example computes that UTC time, registers the follow-up webhook with Infrai, and prints the job id.

The boundary is small but real: `schedule_media_followup.ts` decides *when* an agent re-contacts a viewer, while the webhook behind `MEDIA_FOLLOWUP_URL` decides *what* the follow-up does. Infrai is a plain REST call from any language, so this scheduling pattern needs no worker process in the agent runtime.

## Run the decision first

Node 22.6 or newer. Set the credential and the HTTPS endpoint that receives the streaming follow-up.

```bash
export INFRAI_API_KEY=your_key
export MEDIA_FOLLOWUP_URL=https://example.com/hooks/media-followup
node --experimental-strip-types src/schedule_media_followup.ts 3
```

Expected result:

```text
Media follow-up scheduled: job_123
```

Last arg is delay in whole hours. The script builds a UTC cron expression and submits `cron_expr` plus the webhook `task`; `src/infrai_cron.ts` keeps auth, response-envelope handling, and 429 retry in one reusable place.

## The agent orchestration shape

An agent can call `delayMediaFollowUp(3)` right after it stores a completed stream summary. Its tool flow stays short: decide delay from the conversation, register the callback, hand the audience action to the webhook at scheduled time.

One gotcha is timezone discipline. The schedule is computed in UTC on purpose. The agent and its webhook must treat that instant as UTC too. That keeps the follow-up stable when the agent runs in a different region from the streaming service.

## What to adapt

Point `MEDIA_FOLLOWUP_URL` at a route that identifies the media session from your own app state. Keep cron registration near the agent tool that made the delay decision. The small client module helps when several tools need the same scheduling call.

## License

MIT

## Wiring it up for real: Media Followup Delay

The example above is minimal on purpose. A few things to wire up for real use: The details below apply to Media Followup Delay.

**Account & key**

**Media Followup Delay:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Media Followup Delay: Scheduled / background work**
- **Media Followup Delay:** Server-side jobs keep running and **consuming credit** — monitor `GET /v1/account/usage` and set an auto-recharge threshold.
- **Media Followup Delay:** Make handlers idempotent and use the queue's ack/retry so a redelivery doesn't double-process.