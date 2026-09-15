import app from "./app.js";
import { env } from "./config/env.js";

const startServer = () => {
    const server = app.listen(env.port, () => {
        console.log(`Server is running on http://localhost:${env.port}`);
    });

    server.on("error", (error) => {
        if (error.code === "EADDRINUSE") {
            console.error(`Port ${env.port} is already in use. Please stop the other process or set a different PORT.`);
            process.exit(1);
        }

        console.error("Server failed to start:", error);
        process.exit(1);
    });

    return server;
};

const server = startServer();

export { server };
export default app;