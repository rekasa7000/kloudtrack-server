import { createApp } from "./app";

async function startServer() {
  try {
    const { server } = await createApp();
    const PORT = process.env.PORT || 3000;

    server.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
