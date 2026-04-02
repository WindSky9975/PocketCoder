#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path

import yaml

REQUIRED_FILES = [
    Path("compose.yaml"),
    Path(".env.example"),
    Path("infra/docker/relay.Dockerfile"),
]
REQUIRED_ENV_KEYS = {
    "POCKETCODER_RELAY_HOST",
    "POCKETCODER_RELAY_PORT",
    "POCKETCODER_PUBLIC_BASE_URL",
    "POCKETCODER_RELAY_DB_PATH",
    "POCKETCODER_LOG_LEVEL",
    "POCKETCODER_PAIRING_TOKEN_TTL_SECONDS",
    "POCKETCODER_EVENT_REPLAY_TTL_SECONDS",
}


def print_group(title: str, items: list[str]) -> None:
    if not items:
        return
    print(f"{title}:")
    for item in items:
        print(f"  - {item}")


def load_compose(path: Path, errors: list[str]) -> dict | None:
    try:
        with path.open("r", encoding="utf-8") as handle:
            return yaml.safe_load(handle) or {}
    except FileNotFoundError:
        errors.append(f"missing file: {path.as_posix()}")
    except yaml.YAMLError as exc:
        errors.append(f"invalid YAML in {path.as_posix()}: {exc}")
    return None


def load_env_keys(path: Path, errors: list[str]) -> set[str]:
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except FileNotFoundError:
        errors.append(f"missing file: {path.as_posix()}")
        return set()

    keys: set[str] = set()
    for line in lines:
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, _value = stripped.split("=", 1)
        keys.add(key)
    return keys


def verify_compose(compose_path: Path, passes: list[str], warnings: list[str], errors: list[str]) -> None:
    compose = load_compose(compose_path, errors)
    if compose is None:
        return

    services = compose.get("services")
    if not isinstance(services, dict):
        errors.append("compose.yaml must define a services mapping")
        return

    service_names = set(services)
    if service_names == {"relay"}:
        passes.append("compose.yaml includes only the expected relay service")
    else:
        errors.append("compose.yaml must define exactly one service named 'relay'")
        return

    relay = services["relay"]
    if not isinstance(relay, dict):
        errors.append("compose.yaml relay service must be a mapping")
        return

    build = relay.get("build")
    if isinstance(build, dict) and build.get("dockerfile") == "infra/docker/relay.Dockerfile":
        passes.append("compose.yaml points relay build to infra/docker/relay.Dockerfile")
    else:
        errors.append("compose.yaml relay build must use infra/docker/relay.Dockerfile")

    if relay.get("restart"):
        passes.append("compose.yaml defines a relay restart policy")
    else:
        errors.append("compose.yaml relay service is missing a restart policy")

    if relay.get("healthcheck"):
        passes.append("compose.yaml defines a relay healthcheck")
    else:
        errors.append("compose.yaml relay service is missing a healthcheck")

    volumes = relay.get("volumes")
    if isinstance(volumes, list) and any("/var/lib/pocketcoder" in str(item) for item in volumes):
        passes.append("compose.yaml mounts a persistent relay data path")
    else:
        errors.append("compose.yaml relay service must mount a persistent /var/lib/pocketcoder path")

    ports = relay.get("ports")
    if isinstance(ports, list) and ports:
        passes.append("compose.yaml exposes the relay port")
    else:
        errors.append("compose.yaml relay service must expose a port mapping")

    top_level_volumes = compose.get("volumes")
    if isinstance(top_level_volumes, dict) and "relay-data" in top_level_volumes:
        passes.append("compose.yaml defines the relay-data named volume")
    else:
        errors.append("compose.yaml must define a relay-data named volume")

    if relay.get("env_file"):
        passes.append("compose.yaml references an env file for runtime configuration")
    else:
        warnings.append("compose.yaml does not reference an env file; confirm runtime configuration is still explicit")


def verify_env_file(env_path: Path, passes: list[str], errors: list[str]) -> None:
    keys = load_env_keys(env_path, errors)
    missing = sorted(key for key in REQUIRED_ENV_KEYS if key not in keys)
    if missing:
        errors.append(".env.example is missing expected keys: " + ", ".join(missing))
    else:
        passes.append(".env.example lists the expected deployment variables")


def verify_dockerfile(path: Path, passes: list[str], errors: list[str]) -> None:
    try:
        text = path.read_text(encoding="utf-8")
    except FileNotFoundError:
        errors.append(f"missing file: {path.as_posix()}")
        return

    required_fragments = ["FROM node", "npm install", "apps/relay", "apps/relay/dist/server.js"]
    missing = [fragment for fragment in required_fragments if fragment not in text]
    if missing:
        errors.append("infra/docker/relay.Dockerfile is missing required fragments: " + ", ".join(missing))
    else:
        passes.append("infra/docker/relay.Dockerfile exposes the expected relay build skeleton")


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify PocketCoder selfhost deployment files.")
    parser.add_argument("repo_path", help="Target repository path.")
    args = parser.parse_args()

    repo_root = Path(args.repo_path).resolve()
    if not repo_root.exists() or not repo_root.is_dir():
        parser.error(f"Repository path does not exist or is not a directory: {repo_root}")

    passes: list[str] = []
    warnings: list[str] = []
    errors: list[str] = []

    for relative in REQUIRED_FILES:
        if (repo_root / relative).is_file():
            passes.append(f"present: {relative.as_posix()}")
        else:
            errors.append(f"missing file: {relative.as_posix()}")

    verify_compose(repo_root / "compose.yaml", passes, warnings, errors)
    verify_env_file(repo_root / ".env.example", passes, errors)
    verify_dockerfile(repo_root / "infra/docker/relay.Dockerfile", passes, errors)

    print_group("PASS", sorted(passes))
    print_group("WARN", sorted(warnings))
    print_group("ERROR", sorted(errors))

    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())