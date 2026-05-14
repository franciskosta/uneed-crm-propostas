const fs = require("fs");
const path = require("path");

const root = __dirname;
const outDir = path.join(root, "dist");
const files = [
  "index.html",
  "login.html",
  "suporte.html",
  "styles.css",
  "app.js",
  "pricing.js",
  "suporte.js",
];

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(path.join(outDir, "assets"), { recursive: true });

for (const file of files) {
  fs.copyFileSync(path.join(root, file), path.join(outDir, file));
}

for (const file of fs.readdirSync(path.join(root, "assets"))) {
  fs.copyFileSync(path.join(root, "assets", file), path.join(outDir, "assets", file));
}

const config = {
  url: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "",
  anonKey: process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "",
};

fs.writeFileSync(
  path.join(outDir, "supabase-config.js"),
  `window.UNEED_SUPABASE = ${JSON.stringify(config, null, 2)};\n`,
);

console.log("Build Vercel criado em dist/");
