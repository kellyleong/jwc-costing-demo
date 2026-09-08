#!/usr/bin/env node
import { copyFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const index = path.join(dist, "index.html");
const routes = [
  "login",
  "compare",
  "search/subcontractors",
  "search/suppliers",
  "search/historical-prices",
  "admin/imports",
  "admin/canonical",
  "admin/fx",
  "admin/accounts",
  "admin/feedback",
  "admin/audit",
];

copyFileSync(index, path.join(dist, "404.html"));

for (const route of routes) {
  const routeDirectory = path.join(dist, route);
  mkdirSync(routeDirectory, { recursive: true });
  copyFileSync(index, path.join(routeDirectory, "index.html"));
}
