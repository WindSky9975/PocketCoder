#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path

REQUIRED_DIRECTORIES = [
    Path("apps/agentd/src/platform/windows"),
    Path("apps/agentd/src/platform/windows/tests"),
]

REQUIRED_FILES = [
    Path("apps/agentd/src/platform/windows/desktop-control.ts"),
    Path("apps/agentd/src/platform/windows/input-detector.ts"),
    Path("apps/agentd/src/platform/windows/control-state.ts"),
]

CONTENT_RULES = {
    Path("apps/agentd/src/platform/windows/desktop-control.ts"): [
        "createDesktopControlBoundary",
        "markRemoteControlReleased",
        "handleLocalInput",
    ],
    Path("apps/agentd/src/platform/windows/input-detector.ts"): [
        "LocalInputSignal",
        "createInputDetector",
    ],
    Path("apps/agentd/src/platform/windows/control-state.ts"): [
        "DesktopControlSnapshot",
        "markDesktopControlRecovered",
    ],
}

LEAK_SCAN_TARGETS = [
    Path("apps/agentd/src/sessions"),
    Path("apps/agentd/src/transport"),
    Path("apps/agentd/src/providers"),
]
LEAK_MARKERS = [
    "createInputDetector(",
    "markDesktopControlRecovered(",
    'status: "desktop-recovered"',
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


def scan_for_leaks(repo_root: Path, passes: list[str], warnings: list[str]) -> None:
    found_any = False
    for relative_dir in LEAK_SCAN_TARGETS:
        root = repo_root / relative_dir
        if not root.exists():
            continue

        for path in root.rglob("*.ts"):
            text = path.read_text(encoding="utf-8")
            hits = [marker for marker in LEAK_MARKERS if marker in text]
            if hits:
                found_any = True
                warnings.append(
                    f"{path.relative_to(repo_root).as_posix()} contains Windows-control markers outside platform/windows: {', '.join(hits)}"
                )

    if not found_any:
        passes.append("no Windows control markers were found outside the platform/windows boundary")


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify PocketCoder Windows desktop-control boundaries.")
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

    scan_for_leaks(repo_root, passes, warnings)

    print_group("PASS", sorted(passes))
    print_group("WARN", sorted(warnings))
    print_group("ERROR", sorted(errors))

    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())