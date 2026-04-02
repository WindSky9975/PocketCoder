#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
from pathlib import Path

REQUIRED_FILES = [
    Path("apps/agentd/src/security/device-keys.ts"),
    Path("apps/agentd/src/security/pairing.ts"),
    Path("apps/agentd/src/security/encryptor.ts"),
    Path("apps/relay/src/security/token-service.ts"),
    Path("apps/relay/src/security/access-control.ts"),
    Path("apps/relay/src/security/device-registry.ts"),
    Path("apps/relay/src/modules/pairing/module.ts"),
    Path("apps/relay/src/storage/repositories/pairing-record-repository.ts"),
    Path("apps/web/src/lib/crypto/device-keyring.ts"),
    Path("apps/web/src/features/pairing/pairing-controller.ts"),
    Path("apps/web/src/lib/storage/device-store.ts"),
]

REQUIRED_DIRECTORIES = [
    Path("apps/agentd/src/security"),
    Path("apps/agentd/tests/security"),
    Path("apps/relay/src/security"),
    Path("apps/relay/src/modules/pairing"),
    Path("apps/relay/src/storage/repositories"),
    Path("apps/relay/tests/security"),
    Path("apps/web/src/lib/crypto"),
    Path("apps/web/src/features/pairing"),
    Path("apps/web/src/lib/storage"),
    Path("apps/web/src/tests/unit"),
]

CONTENT_RULES = {
    Path("apps/agentd/src/security/device-keys.ts"): ["privateKeyRef", "DeviceKeyRecord"],
    Path("apps/agentd/src/security/pairing.ts"): ["issuePairingToken", "url"],
    Path("apps/agentd/src/security/encryptor.ts"): ["CipherEnvelope", "ciphertext"],
    Path("apps/relay/src/security/token-service.ts"): ["tokenHash", "canConsumePairingToken"],
    Path("apps/relay/src/security/access-control.ts"): ["canAccessSession", "revokedAt"],
    Path("apps/relay/src/security/device-registry.ts"): ["publicKey", "RegisteredDevice"],
    Path("apps/relay/src/modules/pairing/module.ts"): ["PairingExchangeRequest", "candidatePublicKey"],
    Path("apps/relay/src/storage/repositories/pairing-record-repository.ts"): ["ciphertextBlob", "tokenHash"],
    Path("apps/web/src/lib/crypto/device-keyring.ts"): ["privateKeyRef", "BrowserDeviceKeyRecord"],
    Path("apps/web/src/features/pairing/pairing-controller.ts"): ["buildPairingStartPayload", "candidatePublicKey"],
    Path("apps/web/src/lib/storage/device-store.ts"): ["relayOrigin", "StoredPairedDevice"],
}

RELAY_FILES = [
    Path("apps/relay/src/security/token-service.ts"),
    Path("apps/relay/src/security/access-control.ts"),
    Path("apps/relay/src/security/device-registry.ts"),
    Path("apps/relay/src/modules/pairing/module.ts"),
    Path("apps/relay/src/storage/repositories/pairing-record-repository.ts"),
]
FORBIDDEN_RELAY_FRAGMENTS = {"privateKeyRef", "plaintextPayload", "sessionPlaintext"}
FORBIDDEN_IMPORT_PATTERN = re.compile(r"apps/(agentd|relay|web)|@pocketcoder/(agentd|relay|web)")


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


def verify_relay_restrictions(repo_root: Path, passes: list[str], errors: list[str]) -> None:
    for relative in RELAY_FILES:
        path = repo_root / relative
        if not path.exists():
            continue

        text = path.read_text(encoding="utf-8")
        forbidden = sorted(fragment for fragment in FORBIDDEN_RELAY_FRAGMENTS if fragment in text)
        if forbidden:
            errors.append(
                f"{relative.as_posix()} includes forbidden relay fragments: {', '.join(forbidden)}"
            )
        else:
            passes.append(f"{relative.as_posix()} avoids forbidden relay plaintext or private-key markers")


def verify_cross_workspace_coupling(repo_root: Path, passes: list[str], warnings: list[str]) -> None:
    for relative in REQUIRED_FILES:
        path = repo_root / relative
        if not path.exists():
            continue

        text = path.read_text(encoding="utf-8")
        if FORBIDDEN_IMPORT_PATTERN.search(text):
            warnings.append(
                f"{relative.as_posix()} references app workspace names directly; confirm the dependency stays boundary-safe"
            )
        else:
            passes.append(f"{relative.as_posix()} avoids direct cross-workspace implementation references")


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify PocketCoder pairing and E2EE boundary layers.")
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

    verify_relay_restrictions(repo_root, passes, errors)
    verify_cross_workspace_coupling(repo_root, passes, warnings)

    print_group("PASS", sorted(passes))
    print_group("WARN", sorted(warnings))
    print_group("ERROR", sorted(errors))

    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())