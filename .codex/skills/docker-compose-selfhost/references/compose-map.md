# Compose Map

Use this file when shaping `compose.yaml`.

## Required Service Shape

The baseline stack owns one service:

- `relay`

The service should include:

- image build entry through `infra/docker/relay.Dockerfile`
- explicit environment configuration
- port mapping for the relay HTTP/WebSocket entry point
- a persistent volume for SQLite data
- a basic health check
- a restart policy suitable for single-host operation

## Out of Scope

Do not add cloud-specific deployment blocks, autoscaling, or public exposure defaults here.