/** Short, sortable, human-readable inspection IDs, e.g. INS-M2K8Q-4F7A. */
export function inspectionId() {
  const t = Date.now().toString(36).toUpperCase().slice(-5);
  const r = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `INS-${t}-${r}`;
}

export const uid = () => crypto.randomUUID();
