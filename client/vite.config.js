import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  // Load Server/.env — one level up from client/, inside Server/
  const serverEnv = loadEnv(mode, path.resolve(__dirname, "../Server"), "");

  console.log(
    "[vite] VAPID key loaded:",
    serverEnv.VAPID_PUBLIC_KEY ? "✅ yes" : "❌ not found",
  );

  return {
    plugins: [react()],

    define: {
      // These become import.meta.env.VITE_* inside React code
      "import.meta.env.VITE_VAPID_PUBLIC_KEY": JSON.stringify(
        serverEnv.VAPID_PUBLIC_KEY || "",
      ),
      "import.meta.env.VITE_API_URL": JSON.stringify(
        "http://localhost:5000/api",
      ),
      "import.meta.env.VITE_SOCKET_URL": JSON.stringify(
        "http://localhost:5000",
      ),
    },

    server: {
      port: 5173,
    },
  };
});
