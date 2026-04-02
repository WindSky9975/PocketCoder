export type InstallState = "unsupported" | "ready" | "installed";

export function getInstallState(): InstallState {
  if (typeof window === "undefined") {
    return "unsupported";
  }

  if (window.matchMedia("(display-mode: standalone)").matches) {
    return "installed";
  }

  return "ready";
}