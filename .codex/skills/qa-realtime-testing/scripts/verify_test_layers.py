#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path

REQUIRED_DIRECTORIES = [
    Path("packages/protocol/tests/schema"),
    Path("packages/protocol/tests/compatibility"),
    Path("apps/relay/tests/unit"),
    Path("apps/relay/tests/integration"),
    Path("apps/agentd/tests/unit"),
    Path("apps/agentd/tests/integration"),
    Path("apps/web/src/tests/unit"),
    Path("apps/web/src/tests/smoke"),
]

REQUIRED_FILES = [
    Path("packages/protocol/tests/schema/protocol-schema.spec.ts"),
    Path("packages/protocol/tests/compatibility/message-compat.spec.ts"),
    Path("apps/relay/tests/unit/relay-security.spec.ts"),
    Path("apps/relay/tests/integration/realtime-link.spec.ts"),
    Path("apps/agentd/tests/unit/control-recovery.spec.ts"),
    Path("apps/agentd/tests/integration/session-events.spec.ts"),
    Path("apps/web/src/tests/unit/pairing-shell.spec.ts"),
    Path("apps/web/src/tests/smoke/session-flow.smoke.ts"),
]

CONTENT_RULES = {
    Path("packages/protocol/tests/schema/protocol-schema.spec.ts"): ["pairing", "approval"],
    Path("packages/protocol/tests/compatibility/message-compat.spec.ts"): ["messageId", "compatibility"],
    Path("apps/relay/tests/unit/relay-security.spec.ts"): ["token", "dedupe"],
    Path("apps/relay/tests/integration/realtime-link.spec.ts"): ["subscribe", "reconnect", "replay"],
    Path("apps/agentd/tests/unit/control-recovery.spec.ts"): ["resumeDesktopControl", "local-recovery"],
    Path("apps/agentd/tests/integration/session-events.spec.ts"): ["approval", "idempotency"],
    Path("apps/web/src/tests/unit/pairing-shell.spec.ts"): ["pairing", "approval"],
    Path("apps/web/src/tests/smoke/session-flow.smoke.ts"): ["pair", "session-detail", "prompt"],
}

SENSITIVE_MARKERS = [
    "BEGIN PRIVATE KEY",
    "sk-live",
    "real-token",
    "privateKeyRef: \"",
]


def print_group(title: str, items: list[str]) -> None:
    if not items:
        return
    print(f"{title}:")
    for item in items:
        print(f"  - {item}")


def ensure_text_contains(path: Path, fragments: list[str], passes: list[str], errors: list[str]) -> None:
    try:
        text = path.read_text(encoding="utf-8")
    except FileNotFoundError:
        errors.append(f"missing file: {path.as_posix()}")
        return

    missing = [fragment for fragment in fragments if fragment not in text]
    if missing:
        errors.append(f"{path.as_posix()} is missing required fragments: {', '.join(missing)}")
    else:
        passes.append(f"content verified: {path.as_posix()}")


def scan_for_sensitive_markers(repo_root: Path, passes: list[str], errors: list[str]) -> None:
    found_any = False
    for relative in REQUIRED_FILES:
        path = repo_root / relative
        if not path.exists():
            continue

        text = path.read_text(encoding="utf-8")
        hits = [marker for marker in SENSITIVE_MARKERS if marker in text]
        if hits:
            found_any = True
            errors.append(f"{relative.as_posix()} contains sensitive or misleading fixture markers: {', '.join(hits)}")

    if not found_any:
        passes.append("test placeholders avoid sensitive fixture markers")


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify PocketCoder workspace test layers.")
    parser.add_argument("repo_path", help="Target repository path.")
    args = parser.parse_args()

    repo_root = Path(args.repo_path).resolve()
    if not repo_root.exists() or not repo_root.is_dir():
        parser.error(f"Repository path does not exist or is not a directory: {repo_root}")

    passes: list[str] = []
    warnings: list[str] = []
    errors: list[str] = []

    for relative in REQUIRED_DIRECTORIES:
        if (repo_root / relative).is_dir():
            passes.append(f"present: {relative.as_posix()}/")
        else:
            errors.append(f"missing directory: {relative.as_posix()}/")

    for relative in REQUIRED_FILES:
        if (repo_root / relative).is_file():
            passes.append(f"present: {relative.as_posix()}")
        else:
            errors.append(f"missing file: {relative.as_posix()}")

    for relative, fragments in CONTENT_RULES.items():
        ensure_text_contains(repo_root / relative, fragments, passes, errors)

    scan_for_sensitive_markers(repo_root, passes, errors)

    print_group("PASS", sorted(passes))
    print_group("WARN", sorted(warnings))
    print_group("ERROR", sorted(errors))

    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())