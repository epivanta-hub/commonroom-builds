# dotorch.com deployment

The Golden Day Club mobile PWA is deployed from this repository's root for the custom domain `dotorch.com`.

## Namecheap Advanced DNS

Remove any parking or URL redirect records for `@` and `www`, then add:

| Type | Host | Value | TTL |
|---|---|---|---|
| A Record | @ | 185.199.108.153 | Automatic |
| A Record | @ | 185.199.109.153 | Automatic |
| A Record | @ | 185.199.110.153 | Automatic |
| A Record | @ | 185.199.111.153 | Automatic |
| CNAME Record | www | epivanta-hub.github.io | Automatic |

Do not add a wildcard record.

## GitHub Pages

Repository Settings → Pages:

- Source: GitHub Actions
- Custom domain: `dotorch.com`
- Enforce HTTPS: enable when available

DNS propagation can take time. Verify both `https://dotorch.com` and `https://www.dotorch.com` after GitHub issues the certificate.
