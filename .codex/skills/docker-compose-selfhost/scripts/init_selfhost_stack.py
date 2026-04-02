#!/usr/bin/env python3
from __future__ import annotations

import argparse
from dataclasses import dataclass, field
from pathlib import Path

SKILL_ROOT = Path(__file__).resolve().parents[1]
TEMPLATE_ROOT = SKILL_ROOT / "assets" / "templates" / "selfhost"


@dataclass
class OperationResult:
    created_files: list[str] = field(default_factory=list)
    updated_files: list[str] = field(default_factory=list)
    skipped_files: list[str] = field(default_factory=list)
    created_dirs: list[str] = field(default_factory=list)
    conflicts: list[str] = field(default_factory=list)


def add_unique(bucket: list[str], value: str) -> None:
    if value not in bucket:
        bucket.append(value)


def ensure_repo_root(path: Path, dry_run: bool) -> None:
    if path.exists():
        if not path.is_dir():
            raise SystemExit(f"Target path is not a directory: {path}")
        return

    if not dry_run:
        path.mkdir(parents=True, exist_ok=True)


def ensure_directory(path: Path, repo_root: Path, result: OperationResult, dry_run: bool) -> None:
    if path.exists():
        return

    missing: list[Path] = []
    cursor = path
    while cursor != repo_root and not cursor.exists():
        missing.append(cursor)
        cursor = cursor.parent

    if not dry_run:
        path.mkdir(parents=True, exist_ok=True)

    for item in reversed(missing):
        add_unique(result.created_dirs, item.relative_to(repo_root).as_posix())


def iter_template_files() -> list[Path]:
    return sorted(path for path in TEMPLATE_ROOT.rglob("*") if path.is_file())


def sync_template_file(
    repo_root: Path,
    template_path: Path,
    result: OperationResult,
    allow_overwrite: bool,
    dry_run: bool,
) -> None:
    destination = repo_root / template_path.relative_to(TEMPLATE_ROOT)
    destination_relative = destination.relative_to(repo_root).as_posix()
    template_text = template_path.read_text(encoding="utf-8")

    if destination.exists():
        existing_text = destination.read_text(encoding="utf-8")
        if existing_text == template_text:
            add_unique(result.skipped_files, destination_relative)
            return
        if not allow_overwrite:
            add_unique(result.conflicts, destination_relative)
            return

        ensure_directory(destination.parent, repo_root, result, dry_run)
        if not dry_run:
            destination.write_text(template_text, encoding="utf-8", newline="\n")
        add_unique(result.updated_files, destination_relative)
        return

    ensure_directory(destination.parent, repo_root, result, dry_run)
    if not dry_run:
        destination.write_text(template_text, encoding="utf-8", newline="\n")
    add_unique(result.created_files, destination_relative)


def print_group(title: str, items: list[str]) -> None:
    if not items:
        return
    print(f"{title}:")
    for item in items:
        print(f"  - {item}")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Initialize or repair the PocketCoder selfhost deployment shell.",
    )
    parser.add_argument("repo_path", help="Target repository path.")
    parser.add_argument(
        "--mode",
        choices=("init", "repair"),
        default="init",
        help="Initialization mode. Defaults to init.",
    )
    parser.add_argument(
        "--allow-overwrite",
        action="store_true",
        help="Overwrite conflicting files instead of reporting them.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview changes without writing files.",
    )
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    if not TEMPLATE_ROOT.exists():
        parser.error(f"Template directory is missing: {TEMPLATE_ROOT}")

    repo_root = Path(args.repo_path).resolve()
    result = OperationResult()
    ensure_repo_root(repo_root, args.dry_run)

    compose_path = repo_root / "compose.yaml"
    if args.mode == "init" and compose_path.exists():
        print("[warn] compose.yaml already exists; init will only add or compare required selfhost files.")
    if args.mode == "repair" and not compose_path.exists():
        print("[warn] compose.yaml does not exist yet; repair will behave like init.")

    for template_path in iter_template_files():
        sync_template_file(
            repo_root=repo_root,
            template_path=template_path,
            result=result,
            allow_overwrite=args.allow_overwrite,
            dry_run=args.dry_run,
        )

    if args.dry_run:
        print("[dry-run] no files were written")

    print_group("Created directories", sorted(result.created_dirs))
    print_group("Created files", sorted(result.created_files))
    print_group("Updated files", sorted(result.updated_files))
    print_group("Skipped files", sorted(result.skipped_files))
    print_group("Conflicts", sorted(result.conflicts))

    return 2 if result.conflicts else 0


if __name__ == "__main__":
    raise SystemExit(main())