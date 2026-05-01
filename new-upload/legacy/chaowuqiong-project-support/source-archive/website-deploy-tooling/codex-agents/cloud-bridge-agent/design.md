# Design

## Structure

The design is split into:

1. `cloud-bridge/`
   - operational assets
2. `workspace-audit/`
   - architecture and cleanup records
3. root wrappers
   - compatibility launchers for old command habits

## Data Boundaries

- deployment scripts stay in `cloud-bridge/scripts`
- secrets stay in `cloud-bridge/secrets`
- server and DB templates stay in `cloud-bridge/config`
- reproducible knowledge stays in `cloud-bridge/docs` and `cloud-bridge/history`

## Compatibility

Root wrappers forward into the new bridge directory so existing commands still work.
