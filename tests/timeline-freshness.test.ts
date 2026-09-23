import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { createElement, type ReactNode } from 'react';
import { JSDOM } from 'jsdom';
import type { TimelineEntriesPage } from '@/lib/dashboard-data';
import { messages } from '@/lib/messages';

function page(ids: string[], nextCursor: string | null): TimelineEntriesPage {
  return {
    items: ids.map((id) => ({
      id,
      displayTitle: `title-${id}`,
      displaySummary: id,
      statusLabel: null,
      statusTone: 'muted',
      tags: [],
      createdAt: '2026-09-01T00:00:00.000Z',
      isPending: false,
    })),
    pageInfo: { hasMore: nextCursor !== null, nextCursor, limit: 20 },
  };
}

// One document for the file: @testing-library's `screen` binds to the body it
// sees on first import.
const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost',
});
after(() => dom.window.close());

/**
 * Renders the real timeline against a fake /api/dashboard/entries, where the
 * first page is whatever `server.firstPage` currently holds.
 */
async function setup() {
  Object.assign(globalThis, {
    window: dom.window,
    // next/link's prefetch schedules through self.requestIdleCallback.
    self: dom.window,
    document: dom.window.document,
    HTMLElement: dom.window.HTMLElement,
    Node: dom.window.Node,
    MutationObserver: dom.window.MutationObserver,
    getComputedStyle: dom.window.getComputedStyle,
    IS_REACT_ACT_ENVIRONMENT: true,
  });
  Object.defineProperty(globalThis, 'navigator', {
    value: dom.window.navigator,
    configurable: true,
  });

  const server = { firstPage: page(['old'], 'c1') };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = new URL(String(input), 'http://localhost');
    const body = url.searchParams.get('cursor')
      ? page(['older'], null)
      : server.firstPage;
    return Response.json(body);
  }) as typeof fetch;

  const [{ render, screen, cleanup, act }, userEvent, { AppRouterContext }] =
    await Promise.all([
      import('@testing-library/react'),
      import('@testing-library/user-event'),
      import('next/dist/shared/lib/app-router-context.shared-runtime'),
    ]);
  const { EntriesTimelineClient } =
    await import('@/components/EntriesTimelineClient');
  const router = {
    push() {},
    replace() {},
    refresh() {},
    prefetch() {},
    back() {},
    forward() {},
  };
  const timeline = (initialPage: TimelineEntriesPage): ReactNode =>
    createElement(
      AppRouterContext.Provider,
      { value: router as never },
      createElement(EntriesTimelineClient, { initialPage }),
    );

  return {
    server,
    render,
    screen,
    act,
    timeline,
    user: userEvent.default.setup({ document: dom.window.document }),
    teardown() {
      cleanup();
      globalThis.fetch = originalFetch;
    },
  };
}

test('a remounted timeline shows the entry that was just saved', async () => {
  const t = await setup();
  try {
    // Load a second page so the timeline has something cached.
    const first = t.render(t.timeline(t.server.firstPage));
    await t.user.click(
      t.screen.getByRole('button', { name: messages.dashboard.loadMore }),
    );
    await t.screen.findByText('title-older');
    first.unmount();

    // Save a new entry, come back: the server renders it on the first page.
    t.server.firstPage = page(['new', 'old'], 'c1');
    t.render(t.timeline(t.server.firstPage));
    assert.ok(t.screen.getByText('title-new'));
  } finally {
    t.teardown();
  }
});

test('a server refresh refetches the pages the timeline already loaded', async () => {
  const t = await setup();
  try {
    const view = t.render(t.timeline(t.server.firstPage));
    await t.user.click(
      t.screen.getByRole('button', { name: messages.dashboard.loadMore }),
    );
    await t.screen.findByText('title-older');

    // An undo on the dashboard calls router.refresh(), which re-renders the
    // page with a new first page but keeps this component mounted.
    t.server.firstPage = page(['restored', 'old'], 'c1');
    await t.act(async () => {
      view.rerender(t.timeline(page(['restored', 'old'], 'c1')));
    });
    assert.ok(await t.screen.findByText('title-restored'));
    assert.ok(t.screen.getByText('title-older'));
  } finally {
    t.teardown();
  }
});
