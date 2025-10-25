export function GET() {
  return new Response(JSON.stringify({ ok: true, uptime: process.uptime() }), {
    headers: { "content-type": "application/json" }
  });
}
