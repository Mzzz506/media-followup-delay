import { infrai } from "./infrai_cron.ts";

export async function delayMediaFollowUp(hours: number): Promise<string> {
  if (!Number.isInteger(hours) || hours < 1) {
    throw new Error("hours must be a positive whole number.");
  }

  const task = process.env.MEDIA_FOLLOWUP_URL;
  if (!task) throw new Error("Set MEDIA_FOLLOWUP_URL to the follow-up webhook URL.");

  const fireAt = new Date(Date.now() + hours * 60 * 60 * 1000);
  const idempotencyKey = `media-followup-${fireAt.toISOString()}`;
  const job = await infrai.cron.create(
    { run_at: fireAt.toISOString(), task },
    idempotencyKey,
  );
  return job.job_id;
}

const hours = Number(process.argv[2] ?? "3");
delayMediaFollowUp(hours).then((jobId) => {
  console.log(`Media follow-up scheduled: ${jobId}`);
});
