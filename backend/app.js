import express from "express";
import path from "node:path";
import chatRoutes from "./routes/chat.routes.js";
import websiteRoutes from "./routes/website.routes.js";

const app = express();

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "FDE AI Agent API is running",
  });
});

app.use("/api/chat", chatRoutes);
app.use("/api/websites", websiteRoutes);

const clientDirectory = path.resolve("dist");
app.use(express.static(clientDirectory));
app.get("/{*splat}", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  return res.sendFile(path.join(clientDirectory, "index.html"), (error) => {
    if (error) next();
  });
});

export default app;