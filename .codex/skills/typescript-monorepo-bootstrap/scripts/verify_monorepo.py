#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path

REQUIRED_ROOT_FILES = [
    Path("package.json"),
    Path("tsconfig.base.json"),
    Path("eslint.config.mjs"),
    Path(".gitignore"),
    Path("README.md"),
    Path(".github/workflows/ci.yml"),
]

REQUIRED_DIRECTORIES = [
    Path("apps/web"),
    Path("apps/agentd"),
    Path("apps/relay"),
    Path("packages/protocol"),
]

REQUIRED_WORKSPACE_FILES = [
    Path("apps/web/package.json"),
    Path("apps/web/tsconfig.json"),
    Path("apps/web/next.config.ts"),
    Path("apps/web/next-env.d.ts"),
    Path("apps/web/public/manifest.webmanifest"),
    Path("apps/web/src/app/layout.tsx"),
    Path("apps/web/src/app/page.tsx"),
    Path("apps/web/src/app/globals.css"),
    Path("apps/agentd/package.json"),
    Path("apps/agentd/tsconfig.json"),
    Path("apps/agentd/src/bootstrap.ts"),
    Path("apps/agentd/src/cli/index.ts"),
    Path("apps/relay/package.json"),
    Path("apps/relay/tsconfig.json"),
    Path("apps/relay/src/app.ts"),
    Path("apps/relay/src/server.ts"),
    Path("packages/protocol/package.json"),
    Path("packages/protocol/tsconfig.json"),
    Path("packages/protocol/src/index.ts"),
]

EXPECTED_PACKAGE_NAMES = {
    Path("apps/web"): "@pocketcoder/web",
    Path("apps/agentd"): "@pocketcoder/agentd",
    Path("apps/relay"): "@pocketcoder/relay",
    Path("packages/protocol"): "@pocketcoder/protocol",
}

EXPECTED_SCRIPTS = {
    Path("apps/web"): {"dev", "build", "lint", "typecheck", "test"},
    Path("apps/agentd"): {"dev", "build", "lint", "typecheck", "test"},
    Path("apps/relay"): {"dev", "build", "lint", "typecheck", "test"},
    Path("packages/protocol"): {"build", "lint", "typecheck", "test"},
}

ROOT_SCRIPTS = {"dev", "build", "lint", "typecheck", "test"}
APP_PACKAGE_NAMES = {
    "@pocketcoder/web",
    "@pocketcoder/agentd",
    "@pocketcoder/relay",
}
EXPECTED_APP_DIRS = {"web", "agentd", "relay"}
EXPECTED_PACKAGE_DIRS = {"protocol"}


def load_json(path: Path, errors: list[str]) -> dict | None:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        errors.append(f"missing file: {path.as_posix()}")
    except json.JSONDecodeError as exc:
        errors.append(f"invalid JSON in {path.as_posix()}: {exc}")
    return None


def normalize_workspaces(value: object) -> set[str]:
    if isinstance(value, list):
        return {item for item in value if isinstance(item, str)}
    if isinstance(value, dict):
        packages = value.get("packages")
        if isinstance(packages, list):
            return {item for item in packages if isinstance(item, str)}
    return set()


def collect_dependencies(package_json: dict) -> set[str]:
    names: set[str] = set()
    for key in ("dependencies", "devDependencies", "peerDependencies", "optionalDependencies"):
        value = package_json.get(key, {})
        if isinstance(value, dict):
            names.update(name for name in value if isinstance(name, str))
    return names


def print_group(title: str, items: list[str]) -> None:
    if not items:
        return
    print(f"{title}:")
    for item in items:
        print(f"  - {item}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify the PocketCoder monorepo scaffold.")
    parser.add_argument("repo_path", help="Target repository path.")
    args = parser.parse_args()

    repo_root = Path(args.repo_path).resolve()
    passes: list[str] = []
    warnings: list[str] = []
    errors: list[str] = []

    if not repo_root.exists() or not repo_root.is_dir():
        parser.error(f"Repository path does not exist or is not a directory: {repo_root}")

    for relative in REQUIRED_ROOT_FILES + REQUIRED_WORKSPACE_FILES:
        if (repo_root / relative).exists():
            passes.append(f"present: {relative.as_posix()}")
        else:
            errors.append(f"missing file: {relative.as_posix()}")

    for relative in REQUIRED_DIRECTORIES:
        if (repo_root / relative).is_dir():
            passes.append(f"present: {relative.as_posix()}/")
        else:
            errors.append(f"missing directory: {relative.as_posix()}/")

    root_package = load_json(repo_root / "package.json", errors)
    if root_package is not None:
        if root_package.get("private") is True:
            passes.append("root package is private")
        else:
            errors.append("root package.json must set `private` to true")

        workspaces = normalize_workspaces(root_package.get("workspaces"))
        expected_patterns = {"apps/*", "packages/*"}
        expected_explicit = {"apps/web", "apps/agentd", "apps/relay", "packages/protocol"}
        if expected_patterns.issubset(workspaces) or expected_explicit.issubset(workspaces):
            passes.append("root workspaces include the expected layout")
        else:
            errors.append("root package.json is missing the expected workspaces configuration")

        scripts = root_package.get("scripts", {})
        if isinstance(scripts, dict):
            missing_root_scripts = sorted(script for script in ROOT_SCRIPTS if script not in scripts)
            if missing_root_scripts:
                errors.append(
                    "root package.json is missing scripts: " + ", ".join(missing_root_scripts)
                )
            else:
                passes.append("root package.json includes all required scripts")
        else:
            errors.append("root package.json must define a scripts object")

    apps_dir = repo_root / "apps"
    if apps_dir.is_dir():
        unexpected = sorted(
            child.name for child in apps_dir.iterdir() if child.is_dir() and child.name not in EXPECTED_APP_DIRS
        )
        if unexpected:
            warnings.append("unexpected app workspaces: " + ", ".join(unexpected))
        else:
            passes.append("apps/ contains only the expected workspaces")

    packages_dir = repo_root / "packages"
    if packages_dir.is_dir():
        unexpected = sorted(
            child.name for child in packages_dir.iterdir() if child.is_dir() and child.name not in EXPECTED_PACKAGE_DIRS
        )
        if unexpected:
            warnings.append("unexpected shared packages: " + ", ".join(unexpected))
        else:
            passes.append("packages/ contains only the protocol package")

    for workspace, expected_name in EXPECTED_PACKAGE_NAMES.items():
        package_path = repo_root / workspace / "package.json"
        package_json = load_json(package_path, errors)
        if package_json is None:
            continue

        actual_name = package_json.get("name")
        if actual_name == expected_name:
            passes.append(f"package name matches for {workspace.as_posix()}")
        else:
            errors.append(
                f"{workspace.as_posix()}/package.json should use package name {expected_name!r}"
            )

        scripts = package_json.get("scripts", {})
        if isinstance(scripts, dict):
            missing_scripts = sorted(script for script in EXPECTED_SCRIPTS[workspace] if script not in scripts)
            if missing_scripts:
                errors.append(
                    f"{workspace.as_posix()}/package.json is missing scripts: {', '.join(missing_scripts)}"
                )
            else:
                passes.append(f"required scripts present for {workspace.as_posix()}")
        else:
            errors.append(f"{workspace.as_posix()}/package.json must define a scripts object")

        dependencies = collect_dependencies(package_json)
        if workspace == Path("packages/protocol"):
            forbidden = sorted(name for name in APP_PACKAGE_NAMES if name in dependencies)
            if forbidden:
                errors.append(
                    "packages/protocol must not depend on app packages: " + ", ".join(forbidden)
                )
            else:
                passes.append("packages/protocol does not depend on app workspaces")
            continue

        forbidden = sorted(name for name in APP_PACKAGE_NAMES if name != expected_name and name in dependencies)
        if forbidden:
            errors.append(
                f"{workspace.as_posix()} must not depend on sibling app packages: {', '.join(forbidden)}"
            )
        else:
            passes.append(f"{workspace.as_posix()} does not depend on sibling app workspaces")

        if "@pocketcoder/protocol" in dependencies:
            passes.append(f"{workspace.as_posix()} depends on @pocketcoder/protocol")
        else:
            warnings.append(f"{workspace.as_posix()} does not currently depend on @pocketcoder/protocol")

    print_group("PASS", sorted(passes))
    print_group("WARN", sorted(warnings))
    print_group("ERROR", sorted(errors))

    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())