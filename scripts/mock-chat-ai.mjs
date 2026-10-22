import { createServer } from "node:http";

const port = Number(process.env.MOCK_AI_PORT) || 3198;
let requests = [];

function json(response, status, body) {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

function sseChunk(response, payload) {
  response.write(`data: ${JSON.stringify(payload)}\n\n`);
}

const server = createServer(async (request, response) => {
  if (request.url === "/health") return json(response, 200, { ok: true });
  if (request.url === "/reset") {
    requests = [];
    return json(response, 200, { ok: true });
  }
  if (request.url === "/requests") return json(response, 200, { data: requests });

  if (request.method !== "POST" || !request.url?.endsWith("/chat/completions")) {
    return json(response, 404, { error: "not found" });
  }

  let raw = "";
  for await (const chunk of request) raw += chunk;
  const body = JSON.parse(raw);
  requests.push(body);

  const system = body.messages?.find((message) => message.role === "system")?.content ?? "";
  const lastUser = [...(body.messages ?? [])].reverse().find((message) => message.role === "user");
  const userText = String(lastUser?.content ?? "");
  const hasTool = body.messages?.some((message) => message.role === "tool");
  const narrator = system.includes("rekomendasi latihan");

  if (narrator) {
    return json(response, 200, {
      choices: [
        {
          message: {
            content: JSON.stringify({
              title: "Volume naik 29% dalam 4 minggu",
              body: "Volume mingguan naik dari 1.700 kg ke 2.200 kg (29%). Ambil 1 minggu deload sekitar 60% volume, lalu naik bertahap."
            })
          }
        }
      ],
      usage: { prompt_tokens: 120, completion_tokens: 40 }
    });
  }

  if (!body.stream) {
    return json(response, 200, {
      choices: [{ message: { content: "Ringkasan mock." } }],
      usage: { prompt_tokens: 100, completion_tokens: 20 }
    });
  }

  response.writeHead(200, {
    "content-type": "text/event-stream",
    "cache-control": "no-cache",
    connection: "keep-alive"
  });

  const wantsTool = /program/i.test(userText) && !hasTool;
  if (wantsTool) {
    sseChunk(response, {
      choices: [
        {
          delta: {
            tool_calls: [
              {
                index: 0,
                id: "call_program",
                type: "function",
                function: { name: "get_active_program", arguments: "{}" }
              }
            ]
          }
        }
      ]
    });
    sseChunk(response, {
      choices: [{ delta: {}, finish_reason: "tool_calls" }],
      usage: { prompt_tokens: 300, completion_tokens: 12 }
    });
    response.write("data: [DONE]\n\n");
    return response.end();
  }

  const long = /long/i.test(userText);
  const text = hasTool
    ? "Program aktifmu adalah Upper Lower. Minggu ini 3 sesi, mulai dari Bench Press 3x8-12. [Sumber: program]"
    : "Berdasarkan data terakhir, volume 28 hari terakhir 4.200 kg. Jaga beban naik 2,5 kg bila semua set mencapai batas atas repetisi. [Sumber: data latihan]";
  const parts = long
    ? Array.from({ length: 40 }, (_, index) => `Bagian ${index + 1}: jaga teknik dan progres bertahap. `)
    : text.match(/.{1,22}/g) ?? [text];

  for (const part of parts) {
    if (response.writableEnded) return;
    sseChunk(response, { choices: [{ delta: { content: part } }] });
    await new Promise((resolve) => setTimeout(resolve, long ? 120 : 15));
  }
  sseChunk(response, {
    choices: [{ delta: {}, finish_reason: "stop" }],
    usage: { prompt_tokens: 500, completion_tokens: 80 }
  });
  response.write("data: [DONE]\n\n");
  response.end();
});

server.listen(port, "127.0.0.1", () => {
  console.log(`mock-chat-ai on ${port}`);
});
