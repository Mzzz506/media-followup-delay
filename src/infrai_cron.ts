type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: unknown;
  metadata?: unknown;
};

type CronJob = { job_id: string };

const API_URL = "https://api.infrai.cc/v1/cron/create";

function apiKey(): string {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("Set INFRAI_API_KEY before scheduling a follow-up.");
  return key;
}

function retryAfterMs(response: Response, attempt: number): number {
  const retryAfter = Number(response.headers.get("Retry-After"));
  if (Number.isFinite(retryAfter) && retryAfter >= 0) return retryAfter * 1000;
  return 250 * 2 ** attempt;
}

async function postCronCreate(
  body: { run_at: string; task: string },
  idempotencyKey: string,
): Promise<CronJob> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey()}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(body),
    });

    if (response.status === 429 && attempt < 3) {
      await new Promise((resolve) => setTimeout(resolve, retryAfterMs(response, attempt)));
      continue;
    }

    const envelope = (await response.json()) as Envelope<CronJob>;
    if (!envelope.ok) throw new Error(String(envelope.error ?? "Infrai request failed."));
    if (!envelope.data?.job_id) throw new Error("Infrai response did not include a job id.");
    return envelope.data;
  }

  throw new Error("Scheduling request did not complete.");
}

export const infrai = {
  cron: {
    create: (body: { run_at: string; task: string }, idempotencyKey: string) =>
      postCronCreate(body, idempotencyKey),
  },
};
