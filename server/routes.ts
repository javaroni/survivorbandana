import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import transcodeRouter from "./routes/transcode";

export async function registerRoutes(app: Express): Promise<Server> {
  // Placeholder endpoint for future video transcoding feature
  app.use("/api/transcode", transcodeRouter);

  const httpServer = createServer(app);

  return httpServer;
}
