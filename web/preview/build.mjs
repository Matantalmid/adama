import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const out = resolve(root, "dist-preview");

await build({
  entryPoints: [resolve(here, "main.tsx")],
  bundle: true,
  minifyWhitespace: true,
  minifySyntax: true,
  // Local CSS names stay readable. Minified, esbuild emits names that differ
  // only by case (.A and .a), which collide anywhere class matching is
  // case-insensitive and are unreadable when debugging the published page.
  minifyIdentifiers: false,
  format: "iife",
  target: ["es2022"],
  jsx: "automatic",
  outdir: out,
  entryNames: "app",
  assetNames: "[name]",
  loader: { ".css": "css" },
  // CSS Modules are resolved the same way Next resolves them.
  alias: {
    "next/link": resolve(here, "shims/link.tsx"),
    "next/navigation": resolve(here, "shims/navigation.ts"),
    "@": resolve(root, "src"),
  },
  define: { "process.env.NODE_ENV": '"production"' },
  logLevel: "info",
});
