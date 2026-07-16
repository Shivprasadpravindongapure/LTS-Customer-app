import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { createApp } from "./app";
import { connectDB } from "./config/db";
import { env } from "./config/env";

async function main() {
  const app = createApp();
  const server = http.createServer(app);

  // Socket.IO — wired here so real-time lead notifications (milestone 4)
  // have a server instance to attach to from the start.
  const io = new SocketIOServer(server, {
    cors: { origin: env.clientOrigin },
  });

  io.on("connection", (socket) => {
    console.log(`[socket] client connected: ${socket.id}`);

    // Business owners join a room keyed by their businessId so we can emit
    // targeted "new-enquiry" events later without broadcasting to everyone.
    socket.on("join-business-room", (businessId: string) => {
      socket.join(`business:${businessId}`);
    });

    socket.on("disconnect", () => {
      console.log(`[socket] client disconnected: ${socket.id}`);
    });
  });

  // Make io accessible to controllers via app.locals (used starting milestone 4)
  app.locals.io = io;

  try {
    await connectDB(env.mongoUri);
  } catch (err) {
    console.error("[server] Failed to connect to MongoDB:", (err as Error).message);
    console.error("[server] Server will still start so non-DB routes (e.g. /health) work,");
    console.error("[server] but DB-backed routes will fail until MONGO_URI is reachable.");
  }

  server.listen(env.port, () => {
    console.log(`[server] LTS CRM backend listening on port ${env.port} (${env.nodeEnv})`);
  });
}

main().catch((err) => {
  console.error("[server] Fatal startup error:", err);
  process.exit(1);
});
