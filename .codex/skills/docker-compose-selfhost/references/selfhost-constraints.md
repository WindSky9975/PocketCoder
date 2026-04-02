# Selfhost Constraints

## Scope

This skill owns only the PocketCoder V1 single-host deployment shell. Its baseline is `relay + SQLite` under Docker Compose for local or selfhosted operation.

## Fixed Deployment Direction

Keep the selfhost layer aligned to these choices:

- single-host Docker Compose only
- one relay service plus embedded SQLite storage
- deployment files live under deployment boundaries such as `compose.yaml`, `.env.example`, and `infra/docker/`
- secrets enter through environment variables or ignored files, never through tracked hardcoded values

## Structural Errors To Reject

Treat these as deployment-boundary failures:

- adding Redis, Postgres, or unrelated services to the baseline stack
- storing secrets or real credentials in tracked env files
- placing Docker or Compose logic in application source trees
- expanding the skeleton into a production reverse-proxy or cloud template setup without a separate plan