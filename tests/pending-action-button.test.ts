import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { JSDOM } from 'jsdom';
import { PendingActionButton } from '@/components/PendingActionButton';

test('pending action feedback appears immediately and blocks duplicate clicks', async () => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost' });
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    HTMLElement: dom.window.HTMLElement,
    Node: dom.window.Node,
    MutationObserver: dom.window.MutationObserver,
    getComputedStyle: dom.window.getComputedStyle,
    IS_REACT_ACT_ENVIRONMENT: true,
  });
  Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
  const [{ render, screen, cleanup, act }, userEvent] = await Promise.all([
    import('@testing-library/react'),
    import('@testing-library/user-event'),
  ]);
  let resolveAction: (() => void) | undefined;
  let calls = 0;
  const action = () => new Promise<void>((resolve) => {
    calls += 1;
    resolveAction = resolve;
  });

  try {
    render(createElement(PendingActionButton, { action, idleContent: '保存', pendingContent: '保存中' }));
    const user = userEvent.default.setup();
    await user.click(screen.getByRole('button', { name: '保存' }));
    const pendingButton = screen.getByRole('button', { name: '保存中' });
    assert.equal(pendingButton.hasAttribute('disabled'), true);
    await user.click(pendingButton);
    assert.equal(calls, 1);
    await act(async () => resolveAction?.());
  } finally {
    cleanup();
    dom.window.close();
  }
});
