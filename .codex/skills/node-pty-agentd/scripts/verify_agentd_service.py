#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path

REQUIRED_FILES = [
    Path("apps/agentd/package.json"),
    Path("apps/agentd/tsconfig.json"),
    Path("apps/agentd/src/bootstrap.ts"),
    Path("apps/agentd/src/cli/index.ts"),
    Path("apps/agentd/src/providers/codex/codex-pty.ts"),
    Path("apps/agentd/src/providers/codex/codex-parser.ts"),
    Path("apps/agentd/src/providers/codex/codex-session-adapter.ts"),
    Path("apps/agentd/src/sessions/session-manager.ts"),
    Path("apps/agentd/src/sessions/session-registry.ts"),
    Path("apps/agentd/src/sessions/state-machine.ts"),
    Path("apps/agentd/src/transport/relay-client.ts"),
    Path("apps/agentd/src/transport/command-handler.ts"),
    Path("apps/agentd/src/transport/event-publisher.ts"),
    Path("apps/agentd/src/security/device-keys.ts"),
    Path("apps/agentd/src/security/pairing.ts"),
    Path("apps/agentd/src/security/encryptor.ts"),
    Path("apps/agentd/src/platform/windows/desktop-control.ts"),
    Path("apps/agentd/src/infra/config.ts"),
    Path("apps/agentd/src/infra/logger.ts"),
    Path("apps/agentd/src/infra/paths.ts"),
]

REQUIRED_DIRECTORIES = [
    Path("apps/agentd"),
    Path("apps/agentd/src/cli/commands"),
    Path("apps/agentd/src/providers/codex"),
    Path("apps/agentd/src/sessions"),
    Path("apps/agentd/src/transport"),
    Path("apps/agentd/src/security"),
    Path("apps/agentd/src/platform/windows"),
    Path("apps/agentd/src/infra"),
    Path("apps/agentd/tests/unit"),
    Path("apps/agentd/tests/integration"),
]

REQUIRED_PACKAGE_SCRIPTS = {"dev", "build", "lint", "typecheck", "test"}
EXPECTED_DEPENDENCIES = {"@pocketcoder/protocol"}
FORBIDDEN_APP_DEPENDENCIES = {"@pocketcoder/web", "@pocketcoder/relay"}
ALLOWED_SRC_DIRS = {"cli", "providers", "sessions", "transport", "security", "platform", "infra"}


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
    parser = argparse.ArgumentParser(description="Verify PocketCoder agentd service contracts.")
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

    package_json = read_json(repo_root / "apps/agentd/package.json", errors)
    if package_json is not None:
        if package_json.get("name") == "@pocketcoder/agentd":
            passes.append("package name matches @pocketcoder/agentd")
        else:
            errors.append("apps/agentd/package.json must use name '@pocketcoder/agentd'")

        scripts = package_json.get("scripts", {})
        if isinstance(scripts, dict):
            missing_scripts = sorted(script for script in REQUIRED_PACKAGE_SCRIPTS if script not in scripts)
            if missing_scripts:
                errors.append(
                    "apps/agentd/package.json is missing scripts: " + ", ".join(missing_scripts)
                )
            else:
                passes.append("apps/agentd/package.json includes required scripts")
        else:
            errors.append("apps/agentd/package.json must define a scripts object")

        dependencies = collect_dependencies(package_json)
        missing_dependencies = sorted(dep for dep in EXPECTED_DEPENDENCIES if dep not in dependencies)
        if missing_dependencies:
            errors.append(
                "apps/agentd/package.json is missing expected dependencies: " + ", ".join(missing_dependencies)
            )
        else:
            passes.append("apps/agentd/package.json includes expected dependencies")

        forbidden = sorted(dep for dep in FORBIDDEN_APP_DEPENDENCIES if dep in dependencies)
        if forbidden:
            errors.append(
                "apps/agentd must not depend on sibling app packages: " + ", ".join(forbidden)
            )
        else:
            passes.append("apps/agentd does not depend on sibling app workspaces")

    src_dir = repo_root / "apps/agentd/src"
    if src_dir.is_dir():
        unexpected = sorted(
            child.name for child in src_dir.iterdir() if child.is_dir() and child.name not in ALLOWED_SRC_DIRS
        )
        if unexpected:
            warnings.append("unexpected directories under apps/agentd/src: " + ", ".join(unexpected))
        else:
            passes.append("apps/agentd/src contains only the expected top-level directories")

    ensure_text_contains(
        repo_root / "apps/agentd/src/bootstrap.ts",
        ["createSessionManager", "createRelayClient", "createEventPublisher"],
        passes,
        errors,
    )
    ensure_text_contains(
        repo_root / "apps/agentd/src/providers/codex/codex-pty.ts",
        ["CodexPtyProcess", "createCodexPtyProcess"],
        passes,
        errors,
    )
    ensure_text_contains(
        repo_root / "apps/agentd/src/sessions/state-machine.ts",
        ["ALLOWED_TRANSITIONS", "canTransitionSession"],
        passes,
        errors,
    )

    print_group("PASS", sorted(passes))
    print_group("WARN", sorted(warnings))
    print_group("ERROR", sorted(errors))

    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())