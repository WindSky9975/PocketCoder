#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path

REQUIRED_FILES = [
    Path("packages/protocol/package.json"),
    Path("packages/protocol/tsconfig.json"),
    Path("packages/protocol/src/index.ts"),
    Path("packages/protocol/src/constants/protocol-version.ts"),
    Path("packages/protocol/src/constants/message-types.ts"),
    Path("packages/protocol/src/constants/session-status.ts"),
    Path("packages/protocol/src/schemas/envelope.ts"),
    Path("packages/protocol/src/schemas/pairing.ts"),
    Path("packages/protocol/src/schemas/session.ts"),
    Path("packages/protocol/src/schemas/command.ts"),
    Path("packages/protocol/src/schemas/error.ts"),
    Path("packages/protocol/src/errors/codes.ts"),
    Path("packages/protocol/src/utils/message-id.ts"),
]

REQUIRED_DIRECTORIES = [
    Path("packages/protocol"),
    Path("packages/protocol/src/constants"),
    Path("packages/protocol/src/schemas"),
    Path("packages/protocol/src/errors"),
    Path("packages/protocol/src/utils"),
    Path("packages/protocol/tests/schema"),
    Path("packages/protocol/tests/compatibility"),
]

EXPECTED_MESSAGE_TYPES = [
    "PairingInit",
    "PairingConfirm",
    "DeviceRegistered",
    "SessionSummary",
    "SessionSubscribe",
    "SessionOutputDelta",
    "SessionStateChanged",
    "ApprovalRequested",
    "ApprovalResponse",
    "SendPrompt",
    "InterruptSession",
    "ResumeDesktopControl",
    "Ack",
    "ErrorEnvelope",
]

EXPECTED_SESSION_STATUSES = [
    "idle",
    "running",
    "waiting_input",
    "waiting_approval",
    "error",
    "disconnected",
]

REQUIRED_PACKAGE_SCRIPTS = {"build", "lint", "typecheck", "test"}
APP_PACKAGES = {"@pocketcoder/web", "@pocketcoder/agentd", "@pocketcoder/relay"}
ALLOWED_SRC_DIRS = {"constants", "schemas", "errors", "utils"}


def print_group(title: str, items: list[str]) -> None:
    if not items:
        return
    print(f"{title}:")
    for item in items:
        print(f"  - {item}")


def read_json(path: Path, errors: list[str]) -> dict | None:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        errors.append(f"missing file: {path.as_posix()}")
    except json.JSONDecodeError as exc:
        errors.append(f"invalid JSON in {path.as_posix()}: {exc}")
    return None


def collect_dependencies(package_json: dict) -> set[str]:
    names: set[str] = set()
    for key in ("dependencies", "devDependencies", "peerDependencies", "optionalDependencies"):
        section = package_json.get(key, {})
        if isinstance(section, dict):
            names.update(name for name in section if isinstance(name, str))
    return names


def ensure_text_contains(path: Path, required_fragments: list[str], passes: list[str], errors: list[str]) -> None:
    try:
        text = path.read_text(encoding="utf-8")
    except FileNotFoundError:
        errors.append(f"missing file: {path.as_posix()}")
        return

    missing = [fragment for fragment in required_fragments if fragment not in text]
    if missing:
        errors.append(
            f"{path.as_posix()} is missing required fragments: {', '.join(missing)}"
        )
    else:
        passes.append(f"content verified: {path.as_posix()}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify PocketCoder protocol package contracts.")
    parser.add_argument("repo_path", help="Target repository path.")
    args = parser.parse_args()

    repo_root = Path(args.repo_path).resolve()
    if not repo_root.exists() or not repo_root.is_dir():
        parser.error(f"Repository path does not exist or is not a directory: {repo_root}")

    passes: list[str] = []
    warnings: list[str] = []
    errors: list[str] = []

    for relative in REQUIRED_FILES:
        if (repo_root / relative).exists():
            passes.append(f"present: {relative.as_posix()}")
        else:
            errors.append(f"missing file: {relative.as_posix()}")

    for relative in REQUIRED_DIRECTORIES:
        if (repo_root / relative).is_dir():
            passes.append(f"present: {relative.as_posix()}/")
        else:
            errors.append(f"missing directory: {relative.as_posix()}/")

    package_json = read_json(repo_root / "packages/protocol/package.json", errors)
    if package_json is not None:
        if package_json.get("name") == "@pocketcoder/protocol":
            passes.append("package name matches @pocketcoder/protocol")
        else:
            errors.append("packages/protocol/package.json must use name '@pocketcoder/protocol'")

        scripts = package_json.get("scripts", {})
        if isinstance(scripts, dict):
            missing_scripts = sorted(script for script in REQUIRED_PACKAGE_SCRIPTS if script not in scripts)
            if missing_scripts:
                errors.append(
                    "packages/protocol/package.json is missing scripts: " + ", ".join(missing_scripts)
                )
            else:
                passes.append("packages/protocol/package.json includes required scripts")
        else:
            errors.append("packages/protocol/package.json must define a scripts object")

        dependencies = collect_dependencies(package_json)
        if "zod" in dependencies:
            passes.append("packages/protocol depends on zod")
        else:
            warnings.append("packages/protocol does not currently depend on zod")

        forbidden = sorted(name for name in APP_PACKAGES if name in dependencies)
        if forbidden:
            errors.append(
                "packages/protocol must not depend on app packages: " + ", ".join(forbidden)
            )
        else:
            passes.append("packages/protocol does not depend on app workspaces")

    src_dir = repo_root / "packages/protocol/src"
    if src_dir.is_dir():
        unexpected = sorted(
            child.name for child in src_dir.iterdir() if child.is_dir() and child.name not in ALLOWED_SRC_DIRS
        )
        if unexpected:
            warnings.append("unexpected source directories under packages/protocol/src: " + ", ".join(unexpected))
        else:
            passes.append("packages/protocol/src contains only the expected top-level directories")

    ensure_text_contains(
        repo_root / "packages/protocol/src/constants/message-types.ts",
        EXPECTED_MESSAGE_TYPES,
        passes,
        errors,
    )
    ensure_text_contains(
        repo_root / "packages/protocol/src/constants/session-status.ts",
        EXPECTED_SESSION_STATUSES,
        passes,
        errors,
    )
    ensure_text_contains(
        repo_root / "packages/protocol/src/schemas/envelope.ts",
        ["protocolVersion", "messageId", "timestamp", "type", "payload"],
        passes,
        errors,
    )
    ensure_text_contains(
        repo_root / "packages/protocol/src/index.ts",
        [
            "./constants/protocol-version.js",
            "./constants/message-types.js",
            "./constants/session-status.js",
            "./schemas/envelope.js",
            "./schemas/pairing.js",
            "./schemas/session.js",
            "./schemas/command.js",
            "./schemas/error.js",
            "./errors/codes.js",
            "./utils/message-id.js",
        ],
        passes,
        errors,
    )

    print_group("PASS", sorted(passes))
    print_group("WARN", sorted(warnings))
    print_group("ERROR", sorted(errors))

    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())