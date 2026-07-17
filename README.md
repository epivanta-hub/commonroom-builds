# CommonRoom Review Builds

Binary distribution only — **no source code or credentials live here**. Source repositories are private; review APKs are published through GitHub Releases on this repository so they can be downloaded without a GitHub account.

## Current staging build

| | |
|---|---|
| **File** | `CommonRoom-Experience-Quality-Staging.apk` (latest) |
| **Size** | 176,523,270 bytes (168.4 MB) |
| **SHA-256** | `c3e8b0d56b238bead80b770fe68741b46e786b1fe9f5cc0fa90fa24bc9ffdc12` |
| **Milestone build** | `CommonRoom-Core-Card-Circles-Staging-Review.apk` — 176,515,670 bytes, SHA-256 `5f1de1634fb9d6dbf86fd7b633600e57e882c6e17832fe55d5970b80aa375244` |

## Android requirements

- Android 7.0+ (arm64/armeabi), ~400 MB free storage for install.
- "Install unknown apps" permission for your browser or file manager.
- **Same LAN as the staging server** — these builds talk to `http://192.168.4.37:8787`. Confirm `http://192.168.4.37:8787/up` loads in the device browser first; nothing works off that network.

## Verify before installing

```
# Windows
certutil -hashfile <file>.apk SHA256
# macOS / Linux
sha256sum -c SHA256SUMS.txt
```

The hash must match the table above / `SHA256SUMS.txt` exactly. If a download shows a few bytes or a "Not Found" page, the download failed — do not rename or install it.

## Staging limitations

Internal review builds, **not production**: cleartext HTTP to a LAN staging backend; staging data is disposable; queued notifications need the staging worker running; push notifications are not configured; Google/Apple sign-in targets production and may not work against staging. Do not distribute outside the review group.
