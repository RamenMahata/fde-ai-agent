import express from "express";
import chatRoutes from "./routes/chat.routes.js";

const app = express();

app.use(express.json());

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "FDE AI Agent api is running successfully.",
    });
});

app.use("/api/chat", chatRoutes);

export default app;