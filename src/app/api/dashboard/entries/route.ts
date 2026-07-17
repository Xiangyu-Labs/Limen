import { NextResponse } from 'next/server';
import { buildTimelineEntriesPage, loadDashboardEntriesPage } from '@/lib/dashboard-data';
import { getSession } from '@/lib/auth/session';
import { InputValidationError, normalizeSearchQuery } from '@/lib/validation';
import { decodeEntryCursor } from '@/lib/pagination';

export const maxDuration = 60;
export const preferredRegion = 'sin1';

export async function GET(request: Request) {
  if (!await getSession()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const params = new URL(request.url).searchParams;
    const q = normalizeSearchQuery(params.get('q'));
    const cursorValue = params.get('cursor') ?? undefined;
    decodeEntryCursor(cursorValue);
    const page = await loadDashboardEntriesPage({ q, cursor: cursorValue });
    return NextResponse.json(buildTimelineEntriesPage(page));
  } catch (error) {
    if (error instanceof InputValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Error fetching dashboard entries:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
