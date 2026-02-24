import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  // Read Server/.env (one level up from client/)
  const serverEnv = loadEnv(mode, path.resolve(__dirname, "../Server"), "");

  return {
    plugins: [react()],
    define: {
      "import.meta.env.VITE_VAPID_PUBLIC_KEY": JSON.stringify(
        serverEnv.VAPID_PUBLIC_KEY || ""
      ),
      "import.meta.env.VITE_API_URL": JSON.stringify(
        serverEnv.CLIENT_URL
          ? serverEnv.CLIENT_URL.replace("5173", "5000") + "/api"
          : "http://localhost:5000/api"
      ),
      "import.meta.env.VITE_SOCKET_URL": JSON.stringify(
        serverEnv.CLIENT_URL
          ? serverEnv.CLIENT_URL.replace("5173", "5000")
          : "http://localhost:5000"
      ),
    },
    server: {
      port: 5173,
    },
  };
});
