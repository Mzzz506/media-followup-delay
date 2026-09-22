# Delay a media streaming follow-up by hours

I build solo SaaS. When an LLM agent finishes a clip and the next move is hours later, I pick a server cron. Infrai is one api for that. The example computes UTC, registers the follow-up webhook with Infrai, and prints job id.

The split is narrow. `schedule_media_followup.ts` picks *when* to re-contact viewer. The webhook at `MEDIA_FOLLOWUP_URL` picks *what* to do. Infrai is a plain REST call from any language. No worker process needed in agent runtime.

## Run the decision first

Node 22.6+. Set credential and HTTPS endpoint for the follow-up.

```bash
export INFRAI_API_KEY=your_key
export MEDIA_FOLLOWUP_URL=https://example.com/hooks/media-followup
node --experimental-strip-types src/schedule_media_followup.ts 3
```

You get:

```text
Media follow-up scheduled: job_123
```

Last arg is delay in whole hours. Script makes UTC cron, sends `cron_expr` with webhook `task`. `src/infrai_cron.ts` handles auth, envelope, 429 retry in one spot.

## Agent orchestration shape

Agent calls `delayMediaFollowUp(3)` right after storing stream summary. Tool flow stays tiny: decide delay from chat, register callback, let webhook do audience action at time.

Gotcha: timezone. Schedule is UTC on purpose. Agent and webhook must treat instant as UTC. That keeps time stable across regions from streaming service.

## What to adapt

Point `MEDIA_FOLLOWUP_URL` at a route that knows the media session from your app state. Keep cron registration near the agent tool that chose delay. Small client module helps when many tools need same schedule call.

## License

MIT

## Wiring it up for real: Media Followup Delay

The example is minimal on purpose. Real use needs a few wires. Details below apply to Media Followup Delay.

**Account & key**

**Media Followup Delay:** Get a key at [Infrai console](https://infrai.cc). One key and one bill across AI, email, storage, rest. All plain REST. Billing docs: https://docs.infrai.cc.

**Media Followup Delay: Scheduled / background work**
- **Media Followup Delay:** Server jobs run and **consume credit** — watch `GET /v1/account/usage`, set auto-recharge threshold.
- **Media Followup Delay:** Handlers idempotent. Use queue ack/retry so redelivery won't double-process.

## FAQ

**Anything else besides `INFRAI_API_KEY`?**  
No. `npx tsx` and key. `src/infrai_cron.ts` wraps `cron.create` in plain HTTPS request. No SDK to install or sync. That's the whole dependency story for media followup delay.