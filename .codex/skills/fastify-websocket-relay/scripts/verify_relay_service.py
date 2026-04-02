#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path

REQUIRED_FILES = [
    Path("apps/relay/package.json"),
    Path("apps/relay/tsconfig.json"),
    Path("apps/relay/src/app.ts"),
    Path("apps/relay/src/server.ts"),
    Path("apps/relay/src/transport/http/routes.ts"),
    Path("apps/relay/src/transport/ws/routes.ts"),
    Path("apps/relay/src/security/token-service.ts"),
    Path("apps/relay/src/security/access-control.ts"),
    Path("apps/relay/src/security/device-registry.ts"),
    Path("apps/relay/src/storage/sqlite.ts"),
    Path("apps/relay/src/infra/config.ts"),
    Path("apps/relay/src/infra/logger.ts"),
]

REQUIRED_DIRECTORIES = [
    Path("apps/relay"),
    Path("apps/relay/src/modules/pairing"),
    Path("apps/relay/src/modules/devices"),
    Path("apps/relay/src/modules/sessions"),
    Path("apps/relay/src/modules/replay"),
    Path("apps/relay/src/modules/presence"),
    Path("apps/relay/src/transport/http"),
    Path("apps/relay/src/transport/ws"),
    Path("apps/relay/src/security"),
    Path("apps/relay/src/storage/migrations"),
    Path("apps/relay/src/storage/repositories"),
    Path("apps/relay/src/infra"),
    Path("apps/relay/tests/unit"),
    Path("apps/relay/tests/integration"),
]

REQUIRED_PACKAGE_SCRIPTS = {"dev", "build", "lint", "typecheck", "test"}
EXPECTED_DEPENDENCIES = {"fastify", "@fastify/websocket", "@pocketcoder/protocol"}
FORBIDDEN_APP_DEPENDENCIES = {"@pocketcoder/web", "@pocketcoder/agentd"}
ALLOWED_SRC_DIRS = {"modules", "transport", "security", "storage", "infra"}


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
    parser = argparse.ArgumentParser(description="Verify PocketCoder relay service contracts.")
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

    package_json = read_json(repo_root / "apps/relay/package.json", errors)
    if package_json is not None:
        if package_json.get("name") == "@pocketcoder/relay":
            passes.append("package name matches @pocketcoder/relay")
        else:
            errors.append("apps/relay/package.json must use name '@pocketcoder/relay'")

        scripts = package_json.get("scripts", {})
        if isinstance(scripts, dict):
            missing_scripts = sorted(script for script in REQUIRED_PACKAGE_SCRIPTS if script not in scripts)
            if missing_scripts:
                errors.append(
                    "apps/relay/package.json is missing scripts: " + ", ".join(missing_scripts)
                )
            else:
                passes.append("apps/relay/package.json includes required scripts")
        else:
            errors.append("apps/relay/package.json must define a scripts object")

        dependencies = collect_dependencies(package_json)
        missing_dependencies = sorted(dep for dep in EXPECTED_DEPENDENCIES if dep not in dependencies)
        if missing_dependencies:
            errors.append(
                "apps/relay/package.json is missing expected dependencies: " + ", ".join(missing_dependencies)
            )
        else:
            passes.append("apps/relay/package.json includes expected dependencies")

        forbidden = sorted(dep for dep in FORBIDDEN_APP_DEPENDENCIES if dep in dependencies)
        if forbidden:
            errors.append(
                "apps/relay must not depend on sibling app packages: " + ", ".join(forbidden)
            )
        else:
            passes.append("apps/relay does not depend on sibling app workspaces")

    src_dir = repo_root / "apps/relay/src"
    if src_dir.is_dir():
        unexpected = sorted(
            child.name for child in src_dir.iterdir() if child.is_dir() and child.name not in ALLOWED_SRC_DIRS
        )
        if unexpected:
            warnings.append("unexpected directories under apps/relay/src: " + ", ".join(unexpected))
        else:
            passes.append("apps/relay/src contains only the expected top-level directories")

    ensure_text_contains(
        repo_root / "apps/relay/src/app.ts",
        ["registerHttpRoutes", "registerWsRoutes", "app.register(websocket)"],
        passes,
        errors,
    )
    ensure_text_contains(
        repo_root / "apps/relay/src/server.ts",
        ["buildApp", "app.listen"],
        passes,
        errors,
    )
    ensure_text_contains(
        repo_root / "apps/relay/src/storage/sqlite.ts",
        ["RelayStorage", "createRelayStorage"],
        passes,
        errors,
    )

    print_group("PASS", sorted(passes))
    print_group("WARN", sorted(warnings))
    print_group("ERROR", sorted(errors))

    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())