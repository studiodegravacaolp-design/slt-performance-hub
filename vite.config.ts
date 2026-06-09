// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// Força o preset "vercel" explicitamente para que o Nitro gere o output em .vercel/output
// (necessário para deploy na Vercel — sem isso o Nitro é pulado fora do sandbox Lovable).
export default defineConfig({
  tanstackStart: {
    server: { 
      entry: "server",
      preset: "vercel",
    },
  },
  nitro: { preset: "vercel" },
});