import { buildApp } from "./app.js";

async function main(): Promise<void> {
  const app = await buildApp();
  const port = Number(process.env.PORT ?? 8787);
  const host = process.env.HOST ?? "0.0.0.0";

  await app.listen({ host, port });
}

main().catch((error: unknown) => {
  console.error("[relay] server bootstrap failed", error);
  process.exitCode = 1;
});