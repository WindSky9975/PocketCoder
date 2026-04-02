#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

APP_ROOT = Path("apps/web")
REQUIRED_DIRECTORIES = [
    APP_ROOT / "public",
    APP_ROOT / "public/icons",
    APP_ROOT / "src/app",
    APP_ROOT / "src/app/pair",
    APP_ROOT / "src/app/sessions",
    APP_ROOT / "src/app/sessions/[sessionId]",
    APP_ROOT / "src/app/connection-error",
    APP_ROOT / "src/features/pairing",
    APP_ROOT / "src/features/sessions",
    APP_ROOT / "src/features/approvals",
    APP_ROOT / "src/features/connection",
    APP_ROOT / "src/components/ui",
    APP_ROOT / "src/lib/crypto",
    APP_ROOT / "src/lib/protocol",
    APP_ROOT / "src/lib/realtime",
    APP_ROOT / "src/lib/storage",
    APP_ROOT / "src/lib/pwa",
    APP_ROOT / "src/tests/smoke",
    APP_ROOT / "src/tests/unit",
    APP_ROOT / "service-worker",
]

REQUIRED_FILES = [
    APP_ROOT / "package.json",
    APP_ROOT / "tsconfig.json",
    APP_ROOT / "next.config.ts",
    APP_ROOT / "next-env.d.ts",
    APP_ROOT / "public/manifest.webmanifest",
    APP_ROOT / "src/app/layout.tsx",
    APP_ROOT / "src/app/page.tsx",
    APP_ROOT / "src/app/globals.css",
    APP_ROOT / "src/app/pair/page.tsx",
    APP_ROOT / "src/app/sessions/page.tsx",
    APP_ROOT / "src/app/sessions/[sessionId]/page.tsx",
    APP_ROOT / "src/app/connection-error/page.tsx",
    APP_ROOT / "src/lib/pwa/install.ts",
]

ROUTE_FILES = [
    APP_ROOT / "src/app/layout.tsx",
    APP_ROOT / "src/app/page.tsx",
    APP_ROOT / "src/app/pair/page.tsx",
    APP_ROOT / "src/app/sessions/page.tsx",
    APP_ROOT / "src/app/sessions/[sessionId]/page.tsx",
    APP_ROOT / "src/app/connection-error/page.tsx",
]

EXPECTED_PACKAGE_NAME = "@pocketcoder/web"
EXPECTED_SCRIPTS = {"dev", "build", "lint", "typecheck", "test"}
EXPECTED_DEPENDENCIES = {"next", "react", "react-dom"}
FORBIDDEN_DEPENDENCIES = {"@pocketcoder/agentd", "@pocketcoder/relay"}
DIRECT_LIB_IMPORT_PATTERN = re.compile(r"(?:@/|(?:\.\./)+)lib/(crypto|protocol|realtime|storage)/")
IMPORT_PATTERN = re.compile(r"^\s*import\s+.*?from\s+[\"']([^\"']+)[\"']", re.MULTILINE)


def load_json(path: Path, errors: list[str]) -> dict | None:
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


def verify_package_json(repo_root: Path, passes: list[str], warnings: list[str], errors: list[str]) -> None:
    package_path = repo_root / APP_ROOT / "package.json"
    package_json = load_json(package_path, errors)
    if package_json is None:
        return

    if package_json.get("name") == EXPECTED_PACKAGE_NAME:
        passes.append("apps/web/package.json uses the expected package name")
    else:
        errors.append(f"apps/web/package.json should use package name {EXPECTED_PACKAGE_NAME!r}")

    if package_json.get("private") is True:
        passes.append("apps/web/package.json marks the workspace as private")
    else:
        errors.append("apps/web/package.json must set `private` to true")

    scripts = package_json.get("scripts", {})
    if isinstance(scripts, dict):
        missing_scripts = sorted(script for script in EXPECTED_SCRIPTS if script not in scripts)
        if missing_scripts:
            errors.append("apps/web/package.json is missing scripts: " + ", ".join(missing_scripts))
        else:
            passes.append("apps/web/package.json includes the required scripts")
    else:
        errors.append("apps/web/package.json must define a scripts object")

    dependencies = collect_dependencies(package_json)
    missing_dependencies = sorted(name for name in EXPECTED_DEPENDENCIES if name not in dependencies)
    if missing_dependencies:
        errors.append("apps/web/package.json is missing runtime dependencies: " + ", ".join(missing_dependencies))
    else:
        passes.append("apps/web/package.json includes the expected Next.js runtime dependencies")

    forbidden = sorted(name for name in FORBIDDEN_DEPENDENCIES if name in dependencies)
    if forbidden:
        errors.append("apps/web must not depend on sibling app workspaces: " + ", ".join(forbidden))
    else:
        passes.append("apps/web does not depend on sibling app workspaces")

    if "@pocketcoder/protocol" in dependencies:
        passes.append("apps/web depends on @pocketcoder/protocol as the shared contract source")
    else:
        warnings.append("apps/web does not currently depend on @pocketcoder/protocol")


def verify_manifest(repo_root: Path, passes: list[str], warnings: list[str], errors: list[str]) -> None:
    manifest_path = repo_root / APP_ROOT / "public" / "manifest.webmanifest"
    manifest = load_json(manifest_path, errors)
    if manifest is None:
        return

    required_fields = ["name", "short_name", "start_url", "scope", "display"]
    missing_fields = [field for field in required_fields if field not in manifest]
    if missing_fields:
        errors.append("manifest.webmanifest is missing required fields: " + ", ".join(missing_fields))
    else:
        passes.append("manifest.webmanifest exposes the minimum PWA fields")

    icons = manifest.get("icons")
    if isinstance(icons, list):
        passes.append("manifest.webmanifest declares an icons field")
        if not icons:
            warnings.append("manifest.webmanifest declares no concrete icons yet")
    else:
        warnings.append("manifest.webmanifest should declare an icons array")


def verify_layout_manifest_link(repo_root: Path, passes: list[str], errors: list[str]) -> None:
    layout_path = repo_root / APP_ROOT / "src" / "app" / "layout.tsx"
    if not layout_path.exists():
        return

    text = layout_path.read_text(encoding="utf-8")
    if "manifest.webmanifest" in text:
        passes.append("layout.tsx links the manifest boundary")
    else:
        errors.append("layout.tsx should expose the manifest.webmanifest boundary")


def verify_route_boundaries(repo_root: Path, passes: list[str], warnings: list[str], errors: list[str]) -> None:
    for route_path in ROUTE_FILES:
        file_path = repo_root / route_path
        if not file_path.exists():
            continue

        text = file_path.read_text(encoding="utf-8")
        import_paths = IMPORT_PATTERN.findall(text)

        if any("agentd" in import_path or "relay" in import_path for import_path in import_paths):
            errors.append(f"{route_path.as_posix()} imports desktop or relay implementation code")
        else:
            passes.append(f"{route_path.as_posix()} avoids direct desktop or relay imports")

        direct_lib_imports = sorted(set(DIRECT_LIB_IMPORT_PATTERN.findall(text)))
        if direct_lib_imports:
            warnings.append(
                f"{route_path.as_posix()} directly imports low-level lib boundaries: {', '.join(direct_lib_imports)}"
            )
        else:
            passes.append(f"{route_path.as_posix()} keeps low-level browser libs out of the route file")

        if "new WebSocket(" in text:
            warnings.append(f"{route_path.as_posix()} appears to own WebSocket transport logic directly")


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify the PocketCoder apps/web PWA shell.")
    parser.add_argument("repo_path", help="Target repository path.")
    args = parser.parse_args()

    repo_root = Path(args.repo_path).resolve()
    passes: list[str] = []
    warnings: list[str] = []
    errors: list[str] = []

    if not repo_root.exists() or not repo_root.is_dir():
        parser.error(f"Repository path does not exist or is not a directory: {repo_root}")

    app_dir = repo_root / APP_ROOT
    if app_dir.is_dir():
        passes.append("apps/web directory exists")
    else:
        errors.append("missing directory: apps/web/")

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

    verify_package_json(repo_root, passes, warnings, errors)
    verify_manifest(repo_root, passes, warnings, errors)
    verify_layout_manifest_link(repo_root, passes, errors)
    verify_route_boundaries(repo_root, passes, warnings, errors)

    print_group("PASS", sorted(passes))
    print_group("WARN", sorted(warnings))
    print_group("ERROR", sorted(errors))

    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())