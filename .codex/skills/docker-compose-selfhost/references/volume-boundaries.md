# Volume Boundaries

Use this file when deciding what persists across restarts.

## Persist

- the SQLite data directory used by relay
- any deployment-owned data path that must survive container recreation

## Do Not Persist

- transient build output
- temporary logs that belong to container runtime inspection only
- arbitrary workspace directories outside the documented deployment boundary

## Practical Rule

Keep the writable deployment surface narrow. If a path does not need to survive restart, it should not be a named volume.