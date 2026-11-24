import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import { test } from "node:test";

const root = new URL("../", import.meta.url);
const indexUrl = new URL("index.html", root);

test("the editor uses local static assets and the UI SDK module", async () => {
  const html = await readFile(indexUrl, "utf8");
  const scriptSources = Array.from(
    html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g),
    ([, source]) => source,
  );

  const versioned = async (path) => {
    const bytes = await readFile(new URL(path, root));
    const version = createHash("sha256").update(bytes).digest("hex").slice(0, 12);
    return `${path}?v=${version}`;
  };
  assert.ok(html.includes(`<link rel="stylesheet" href="${await versioned("assets/css/app.css")}">`));
  assert.doesNotMatch(html, /<style\b/);
  assert.doesNotMatch(html, /<script\b(?![^>]*\bsrc=)/);
  assert.deepEqual(scriptSources, [
    "https://ui-sdk.dev/web.js",
    "assets/vendor/konva-10.3.0.min.js",
    "assets/vendor/lucide-1.21.0.min.js",
    await versioned("assets/js/app.js"),
  ]);

  await Promise.all([
    access(new URL("assets/css/app.css", root)),
    access(new URL("assets/js/app.js", root)),
    access(new URL("assets/vendor/konva-10.3.0.min.js", root)),
    access(new URL("assets/vendor/lucide-1.21.0.min.js", root)),
  ]);
});

test("both HTML pages load UI SDK and its styles in the head", async () => {
  for (const path of ["index.html", "dev/break-ui.html"]) {
    const html = await readFile(new URL(path, root), "utf8");
    const head = html.match(/<head>([\s\S]*?)<\/head>/)?.[1] ?? "";
    const asyncAttribute = path === "index.html" ? " async" : "";
    assert.ok(head.includes(`<script type="module" src="https://ui-sdk.dev/web.js"${asyncAttribute}></script>`), path);
    assert.ok(head.includes('<link rel="stylesheet" href="https://ui-sdk.dev/web.css" />'), path);
  }
});

test("vendored library files match the documented releases", async () => {
  const hash = async (path) =>
    createHash("sha256").update(await readFile(new URL(path, root))).digest("hex");

  assert.equal(
    await hash("assets/vendor/konva-10.3.0.min.js"),
    "f17dfd9abb8c95953f09893cfefaaf9e09b9205012f6a2e3976dc946c89f6d7d",
  );
  assert.equal(
    await hash("assets/vendor/lucide-1.21.0.min.js"),
    "3c91b931c3b7192e3d96bbf5398a10506062221f8c9a18809fdc05405af7051a",
  );
});
