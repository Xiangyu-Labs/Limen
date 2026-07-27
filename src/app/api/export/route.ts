import { db } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { formatDateInTimeZone } from '@/lib/entry-date';
import {
  createTextStream,
  filterEntriesByTags,
  InvalidExportParametersError,
  jsonExportChunks,
  markdownExportChunks,
  parseExportParameters,
  type ExportEntry,
  type ExportFilters,
} from '@/lib/export-core';
import { getSettings } from '@/lib/settings';
import type { AppSettings } from '@/lib/settings-core';
import { loadExportEntries } from '@/lib/export-data';

export const maxDuration = 60;
export const preferredRegion = 'sin1';

type ExportRouteDeps = {
  authorize: () => unknown | Promise<unknown>;
  loadSettings: () => AppSettings | Promise<AppSettings>;
  loadEntries: (filters: ExportFilters) => Promise<ExportEntry[]>;
  now?: () => Date;
  reportError?: (error: unknown) => void;
};

function redirectTo(request: Request, status: 'invalid' | 'error' | 'empty') {
  return Response.redirect(
    new URL(`/settings?export=${status}`, request.url),
    303,
  );
}

export function createExportRouteHandler({
  authorize,
  loadSettings,
  loadEntries,
  now = () => new Date(),
  reportError = (error) => console.error('Export failed:', error),
}: ExportRouteDeps) {
  return async function GET(request: Request) {
    if (!(await authorize())) {
      return Response.redirect(new URL('/login', request.url), 303);
    }

    let filters: ExportFilters;
    try {
      filters = parseExportParameters(new URL(request.url).searchParams);
    } catch (error) {
      if (error instanceof InvalidExportParametersError)
        return redirectTo(request, 'invalid');
      reportError(error);
      return redirectTo(request, 'error');
    }

    try {
      const [rows, settings] = await Promise.all([
        loadEntries(filters),
        loadSettings(),
      ]);
      const filtered = filterEntriesByTags(rows, filters.tags);
      if (filtered.length === 0) return redirectTo(request, 'empty');

      const exportedAt = now();
      const chunks =
        filters.format === 'markdown'
          ? markdownExportChunks(filtered, filters, exportedAt)
          : jsonExportChunks(filtered, filters, exportedAt);
      const extension = filters.format === 'markdown' ? 'md' : 'json';
      const contentType =
        filters.format === 'markdown'
          ? 'text/markdown; charset=utf-8'
          : 'application/json; charset=utf-8';
      const filename = `limen-export-${formatDateInTimeZone(exportedAt, settings.timeZone)}.${extension}`;

      return new Response(createTextStream(chunks), {
        headers: {
          'Cache-Control': 'no-store',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Type': contentType,
          'X-Content-Type-Options': 'nosniff',
        },
      });
    } catch (error) {
      reportError(error);
      return redirectTo(request, 'error');
    }
  };
}

const GET = createExportRouteHandler({
  authorize: getSession,
  loadSettings: getSettings,
  loadEntries: (filters) => loadExportEntries(db, filters),
});

export { GET };
