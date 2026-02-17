/**
 * SaveAutoRefresher is no longer needed in the Vite+IPC architecture.
 * File change events are pushed via IPC directly to each page that needs them.
 * This is kept as a no-op for backwards compatibility with any remaining imports.
 */
export function SaveAutoRefresher(): null {
  return null;
}
