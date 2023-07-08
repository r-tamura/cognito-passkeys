import { Hono } from "hono";
import { handle } from "hono/cloudflare-pages";
const app = new Hono();

interface Env {
  KV: KVNamespace;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
}

app.get("/api/helloworld", (c) => {
  console.log(c.env.AWS_ACCESS_KEY_ID);
  return c.text("Hello, world!");
});

export const onRequest = handle(app);
