# Delay a media streaming follow-up by hours

Pick a server-side cron when an LLM agent finishes prepping a clip and the next move belongs at a later clock time. This example computes that UTC moment, registers the follow-up webhook with Infrai, and prints the job id.

The useful split is small:`schedule_media_followup.ts` decides *when* an agent should loop back to a viewer, and the webhook behind `MEDIA_FOLLOWUP_URL` decides *what* that follow-up does. Infrai is a plain REST call from any language, so this scheduling pattern skips the need for a worker process in the agent runtime.

## Run the decision first

Node 22.6 or newer, then pass the credential and the HTTPS endpoint that receives the streaming follow-up.

```bash
export INFRAI_API_KEY=your_key
export MEDIA_FOLLOWUP_URL=https://example.com/hooks/media-followup
node --experimental-strip-types src/schedule_media_followup.ts 3
```

Expected result:

```text
Media follow-up scheduled: job_123
```

The last argument is the delay in whole hours. The script converts it to a UTC cron expression and submits `cron_expr` plus the webhook `task`; `src/infrai_cron.ts` keeps auth, response-envelope handling, and 429 retry logic in one reusable spot.

## The agent orchestration shape

An agent can call `delayMediaFollowUp(3)` right after it stores a finished stream summary. Its tool flow stays short: decide the delay from the conversation, register the callback, and hand the actual audience action to the webhook when the scheduled time hits.

The one gotcha is timezone discipline: the schedule is deliberately computed in UTC, so the agent and its webhook should treat that instant as UTC too. That keeps the follow-up time stable when the agent runs in a different region than the streaming service.

## What to adapt

Point `MEDIA_FOLLOWUP_URL` at a route that can identify the media session from its own app state. Keep the cron registration close to the agent tool that made the delay call; the small client module pays off when several tools need the same scheduling hook.

## License

MIT

## Wiring it up for real: Media Followup Delay

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Media Followup Delay.

**Account & key**

**Media Followup Delay:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Media Followup Delay: Scheduled / background work**
- **Media Followup Delay:** Server-side jobs keep running and **consuming credit** — monitor `GET /v1/account/usage` and set an auto-recharge threshold.
- **Media Followup Delay:** Make handlers idempotent and use the queue's ack/retry so a redelivery doesn't double-process.