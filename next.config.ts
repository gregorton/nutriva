import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
    `pg` picks its socket implementation at runtime: node:net under Node, and `pg-cloudflare`'s
    CloudflareSocket when it detects a Worker (node_modules/pg/lib/stream.js). That second branch
    is `require('pg-cloudflare')`, and the package exports two different files for it — `dist/
    index.js` under the `workerd` condition, a do-nothing `dist/empty.js` under any other.

    Next traces the module graph with Node's conditions, so it only ever copies `empty.js`. The
    adapter then bundles the server with esbuild under the `workerd` condition, asks for
    `dist/index.js`, and the build fails on `Could not resolve "pg-cloudflare"`. Tracing the whole
    package in puts the real file where esbuild expects it.
  */
  outputFileTracingIncludes: {
    "**/*": ["./node_modules/pg-cloudflare/**/*"],
  },
};

export default nextConfig;
