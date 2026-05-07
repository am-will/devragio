import * as esbuild from "esbuild";
import { execSync } from "node:child_process";

const watch = process.argv.includes("--watch");

/** @type {esbuild.BuildOptions} */
const cliOptions = {
  entryPoints: ["src/cli.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outfile: "dist/cli.js",
  packages: "external",
  banner: { js: "#!/usr/bin/env node" },
  sourcemap: true,
};

if (watch) {
  const ctx = await esbuild.context(cliOptions);
  await ctx.watch();
  console.log("watching...");
} else {
  await esbuild.build(cliOptions);
  execSync("tsc -p tsconfig.lib.json", { stdio: "inherit" });
  console.log("build complete");
}
