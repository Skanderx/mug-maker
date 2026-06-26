# Vendored browser libraries

These files are committed so the application can be deployed as plain static
files without depending on a live package CDN at runtime.

| File | Package | Version | Source | SHA-256 | License |
| --- | --- | --- | --- | --- | --- |
| `konva-10.3.0.min.js` | Konva | 10.3.0 | https://cdn.jsdelivr.net/npm/konva@10.3.0/konva.min.js | `f17dfd9abb8c95953f09893cfefaaf9e09b9205012f6a2e3976dc946c89f6d7d` | MIT |
| `lucide-1.21.0.min.js` | Lucide | 1.21.0 | https://unpkg.com/lucide@1.21.0/dist/umd/lucide.min.js | `3c91b931c3b7192e3d96bbf5398a10506062221f8c9a18809fdc05405af7051a` | ISC |

To upgrade a library, download the exact version into this directory, update
the file reference in `index.html`, refresh the checksum above, and run
`npm test`.
