// This spike routes selections for previews and has no disclosure operation.
export function previewDecision(entry, wallet, { introduced = false, automatic = false, privateKinds = new Set() } = {}) {
  if (entry.ownerOnly || entry.supersededBy) return 'omit';
  if (!introduced || !automatic || entry.policy !== 'ordinary' || privateKinds.has(entry.kind) ||
      !wallet.kinds.includes(entry.kind) || wallet.sensitiveKind(entry.kind) || !wallet.safeExcerpt(entry.text, entry.kind)) {
    return 'ask';
  }
  return 'automatic';
}
