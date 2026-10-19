/**
 * Format timestamp into human-readable relative time or formatted date using standard browser Intl APIs.
 * Supports both English ('en') and Norwegian ('nb-NO').
 */

export function formatRelativeTime(timestampMs: number, locale: string = 'en'): string {
  if (!timestampMs || isNaN(timestampMs)) return '';

  const now = Date.now();
  const diffSeconds = Math.round((timestampMs - now) / 1000);
  const diffMinutes = Math.round(diffSeconds / 60);
  const diffHours = Math.round(diffMinutes / 60);
  const diffDays = Math.round(diffHours / 24);

  const rtfLocale = locale.startsWith('nb') ? 'nb-NO' : 'en';

  try {
    const rtf = new Intl.RelativeTimeFormat(rtfLocale, { numeric: 'auto' });

    if (Math.abs(diffSeconds) < 60) {
      return rtf.format(diffSeconds, 'second');
    }
    if (Math.abs(diffMinutes) < 60) {
      return rtf.format(diffMinutes, 'minute');
    }
    if (Math.abs(diffHours) < 24) {
      return rtf.format(diffHours, 'hour');
    }
    if (Math.abs(diffDays) < 30) {
      return rtf.format(diffDays, 'day');
    }
  } catch {
    // Fallback if RelativeTimeFormat is unavailable
  }

  return formatDate(new Date(timestampMs).toISOString(), locale);
}

export function formatDate(isoOrTimestamp?: string | number, locale: string = 'en'): string {
  if (!isoOrTimestamp) return '';
  const d = new Date(isoOrTimestamp);
  if (Number.isNaN(d.getTime())) return '';

  const intlLocale = locale.startsWith('nb') ? 'nb-NO' : 'en-US';
  try {
    return new Intl.DateTimeFormat(intlLocale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return d.toLocaleDateString();
  }
}

export function formatDateTime(isoOrTimestamp?: string | number, locale: string = 'en'): string {
  if (!isoOrTimestamp) return '';
  const d = new Date(isoOrTimestamp);
  if (Number.isNaN(d.getTime())) return '';

  const intlLocale = locale.startsWith('nb') ? 'nb-NO' : 'en-US';
  try {
    return new Intl.DateTimeFormat(intlLocale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
}
