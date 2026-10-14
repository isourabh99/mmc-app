import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "next/navigation": path.resolve(__dirname, "./src/compat/next-navigation.tsx"),
        "next/link": path.resolve(__dirname, "./src/compat/next-link.tsx"),
        "next/image": path.resolve(__dirname, "./src/compat/next-image.tsx"),
        "next/router": path.resolve(__dirname, "./src/compat/next-navigation.tsx"),
      },
    },
    define: {
      "process.env": JSON.stringify(env),
    },
    server: {
      port: 3000,
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
    },
  };
});
