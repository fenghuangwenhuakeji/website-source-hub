# 2026-04-13 Admin Web-Manage Deploy

## Release Scope

- project: `apps/frontent/web-manage`
- target: `/var/www/chaowuqiong/apps/web-manage/dist`
- bridge: `cloud-bridge/scripts/run-scp-via-clash.ps1` + `run-ssh-command-via-clash.ps1`
- release timestamp: `20260413-041320`

## What Was Deployed

- removed global `antd` provider usage from the root login path
- replaced login and layout shell with lighter custom components
- split former `vendor-antd-core` into:
  - `vendor-antd-foundation-D3b4emjK.js`
  - `vendor-antd-icons-DfNO7h28.js`
  - `vendor-antd-display-C3zIg_Rg.js`
  - `vendor-antd-forms-DZ348XKY.js`
  - `vendor-antd-table-BKWL9s2T.js`
- current main entry asset:
  - `index-BKo6rn34.js`

## Remote Actions

- uploaded archive to `/tmp/admin-dist-20260413-041320.tar.gz`
- backed up previous dist to:
  - `/var/www/chaowuqiong/apps/web-manage/dist_backup_20260413-041320`
- replaced live directory with the new `dist`
- cleaned temporary upload archives from `/tmp`

## Validation

- `curl -I http://127.0.0.1/admin/` returned `HTTP/1.1 200 OK`
- `curl -s http://127.0.0.1/admin/ | grep index-...` returned:
  - `index-BKo6rn34.js`
- `curl -s https://fhwhkj.top/admin/ | grep index-...` returned:
  - `index-BKo6rn34.js`
- `nginx -t` passed during deployment

## Current Asset Snapshot

- `layout-D68C7cuA.js`
- `login-Bybp0TEL.js`
- `vendor-antd-display-C3zIg_Rg.js`
- `vendor-antd-forms-DZ348XKY.js`
- `vendor-antd-foundation-D3b4emjK.js`
- `vendor-antd-icons-DfNO7h28.js`
- `vendor-antd-misc-CL3EWx2X.js`
- `vendor-antd-table-BKWL9s2T.js`
- `vendor-react-B3nZt_Ht.js`
- `vendor-router-B2NNrY33.js`

## Notes

- local package used for upload was created from the freshly rebuilt `dist`
- the prior dist remains available under the backup path for rollback if needed
