export function dashboardPath() {
  return '/';
}

export function loginPath() {
  return '/login';
}

export function entryDetailPath(id: string) {
  return `/entries/${id}`;
}

export function entryEditPath(id: string) {
  return `/entries/${id}/edit`;
}

export function newEntryPath() {
  return '/entries/new';
}

export function stripLegacyLocalePath(pathname: string) {
  if (pathname === '/zh' || pathname === '/en') return '/';
  if (pathname.startsWith('/zh/')) return pathname.slice(3);
  if (pathname.startsWith('/en/')) return pathname.slice(3);
  return pathname;
}
