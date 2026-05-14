# Download CDN Runbook

The public download page supports CDN/object-storage distribution without changing existing behavior.

## Current fallback

If no environment variables are configured, the website still uses the current origin-hosted files:

- `/downloads/fenghuang/fenghuang-windows-setup-1.0.3.exe`
- `/downloads/fenghuang/fenghuang-windows-portable-1.0.3.exe`
- `/downloads/fenghuang/fenghuang-mac-1.0.3-universal.dmg`
- `/downloads/fenghuang/fenghuang-mac-1.0.3-universal.zip`

Keep the legacy `latest` URLs as redirects or aliases for compatibility:

- `/downloads/fenghuang/windows-latest.exe`
- `/downloads/fenghuang/windows-portable-latest.exe`
- `/downloads/fenghuang/mac-latest.dmg`
- `/downloads/fenghuang/mac-latest.zip`

## Recommended CDN setup

1. Upload installers to OSS/object storage.
2. Put CDN in front of the bucket.
3. Use versioned filenames, for example `fenghuang-windows-setup-1.2.0.exe`.
4. Configure the website build with explicit file URLs:

```bash
VITE_DESKTOP_DOWNLOAD_WINDOWS_URL=https://cdn.example.com/fenghuang/fenghuang-windows-setup-1.2.0.exe
VITE_DESKTOP_DOWNLOAD_WINDOWS_PORTABLE_URL=https://cdn.example.com/fenghuang/fenghuang-windows-portable-1.2.0.exe
VITE_DESKTOP_DOWNLOAD_MAC_DMG_URL=https://cdn.example.com/fenghuang/fenghuang-mac-1.2.0-universal.dmg
VITE_DESKTOP_DOWNLOAD_MAC_ZIP_URL=https://cdn.example.com/fenghuang/fenghuang-mac-1.2.0-universal.zip
```

For temporary compatibility with the existing latest filenames, configure only the shared directory:

```bash
VITE_DESKTOP_DOWNLOAD_BASE_URL=https://cdn.example.com/fenghuang
```

That maps to:

- `https://cdn.example.com/fenghuang/fenghuang-windows-setup-1.0.3.exe`
- `https://cdn.example.com/fenghuang/fenghuang-windows-portable-1.0.3.exe`
- `https://cdn.example.com/fenghuang/fenghuang-mac-1.0.3-universal.dmg`
- `https://cdn.example.com/fenghuang/fenghuang-mac-1.0.3-universal.zip`

## Origin cache headers

If the origin continues to serve downloads, add download-specific caching to Nginx:

```nginx
location ^~ /downloads/fenghuang/ {
    root /srv/prod-sites/fenghuang-platform/current/website;
    add_header Cache-Control "public, max-age=86400";
    access_log /var/log/nginx/fhwhkj-downloads.log main;
    try_files $uri =404;
}
```

For hashed Vite assets, use a long immutable cache:

```nginx
location ^~ /assets/ {
    root /srv/prod-sites/fenghuang-platform/current/website;
    add_header Cache-Control "public, max-age=31536000, immutable";
    try_files $uri =404;
}
```

Avoid long immutable caching for `windows-latest.exe` style names unless the CDN purge process is reliable. Versioned filenames are safer.

## Speed checks

Use a range request to test installer throughput without downloading the full file:

```bash
curl -L -r 0-10485759 -o /dev/null -w "status=%{http_code} total=%{time_total} speed=%{speed_download}\n" https://fhwhkj.top/downloads/fenghuang/fenghuang-windows-setup-1.0.3.exe
```

Use headers to confirm CDN/cache behavior:

```bash
curl -I https://cdn.example.com/fenghuang/fenghuang-windows-setup-1.2.0.exe
```

Look for provider-specific cache headers such as `X-Cache`, `Via`, `Age`, or equivalent CDN hit/miss headers.
