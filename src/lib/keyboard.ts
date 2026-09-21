type SaveShortcutEvent = {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
};

/**
 * Cmd+Enter on macOS, Ctrl+Enter elsewhere. Alt and Shift are excluded so the
 * shortcut does not swallow other editor combinations.
 */
export function isSaveShortcut(event: SaveShortcutEvent) {
  return (
    event.key === 'Enter' &&
    (event.metaKey || event.ctrlKey) &&
    !event.altKey &&
    !event.shiftKey
  );
}
