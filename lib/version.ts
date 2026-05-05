// Internal version manifest for Kunjara OS.
// Update PATCH on bug fixes, MINOR on new features, MAJOR on breaking changes.

export const VERSION = {
  major:    1,
  minor:    0,
  patch:    0,
  label:    "1.0.0",

  // Internal serial — increment on every production release
  serial:   "KOS-2026-001",

  // Build metadata
  codename: "Atlas",
  buildDate: "2026-05-06",
  commitHash: "e7e5efe",

  // Human-readable
  toString() {
    return `Kunjara OS™ v${this.label} (${this.serial})`;
  },
} as const;

export type VersionInfo = typeof VERSION;
