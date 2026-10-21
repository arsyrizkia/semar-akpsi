/**
 * Jembatan WebSocket -> TCP agar @neondatabase/serverless dapat memakai PostgreSQL lokal (basis data uji).
 * Pakai: node scripts/jembatan-ws-pg.mjs [portWs=54330] [portPg=54329]
 * Lalu jalankan aplikasi/e2e dengan SEMAR_DB_WS_PROXY=127.0.0.1:54330 dan DATABASE_URL_UJI=postgres://semar@127.0.0.1:54329/semar_uji
 */
import net from "node:net";
import { WebSocketServer } from "ws";

const portWs = Number(process.argv[2] ?? 54330);
const portPg = Number(process.argv[3] ?? 54329);
const wss = new WebSocketServer({ port: portWs, host: "127.0.0.1" });
wss.on("connection", (ws) => {
  const tcp = net.connect(portPg, "127.0.0.1");
  const antre = [];
  let siap = false;
  tcp.on("connect", () => {
    siap = true;
    for (const b of antre) tcp.write(b);
  });
  tcp.on("data", (d) => ws.send(d));
  tcp.on("close", () => ws.close());
  tcp.on("error", () => ws.close());
  ws.on("message", (d) => (siap ? tcp.write(d) : antre.push(d)));
  ws.on("close", () => tcp.destroy());
  ws.on("error", () => tcp.destroy());
});
console.log(`jembatan ws://127.0.0.1:${portWs} -> tcp ${portPg}`);
