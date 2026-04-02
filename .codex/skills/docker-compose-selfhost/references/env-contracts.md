# Env Contracts

Use this file when editing `.env.example` or deployment-facing config names.

## Expected Placeholder Variables

Keep environment variables explicit for:

- relay host binding
- relay port
- public base URL or equivalent local entry point
- SQLite data path inside the container
- log level
- token TTL or replay TTL style tuning placeholders

## Sensitivity Guidance

The example file may document variable names and safe defaults, but must not contain real secrets or production-only values.