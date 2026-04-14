const JST_OFFSET_MINUTES = 9 * 60;

export function getJSTDate(): string {
  const now = new Date();
  // UTC時刻から日本時間に変換（+9時間）
  const utcYear = now.getUTCFullYear();
  const utcMonth = now.getUTCMonth();
  const utcDate = now.getUTCDate();
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();

  // UTC時刻に9時間を加算
  const jstDate = new Date(Date.UTC(utcYear, utcMonth, utcDate, utcHours + 9, utcMinutes));

  const year = jstDate.getUTCFullYear();
  const month = String(jstDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(jstDate.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function getJSTDateTime(): Date {
  const now = new Date();
  // UTC時刻から日本時間に変換（+9時間）
  const utcYear = now.getUTCFullYear();
  const utcMonth = now.getUTCMonth();
  const utcDate = now.getUTCDate();
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const utcSeconds = now.getUTCSeconds();
  const utcMilliseconds = now.getUTCMilliseconds();

  return new Date(Date.UTC(utcYear, utcMonth, utcDate, utcHours + 9, utcMinutes, utcSeconds, utcMilliseconds));
}

export function getJSTDateTimeString(): string {
  const jstDateTime = getJSTDateTime();
  return jstDateTime.toISOString().slice(0, 16);
}

export function getJSTTimestamp(): string {
  const now = new Date();
  const utcTime = now.getTime();
  const jstTime = new Date(utcTime + JST_OFFSET_MINUTES * 60000);
  return jstTime.toISOString();
}

export function formatJSTDate(utcDateString: string): string {
  const date = new Date(utcDateString);
  const utcTime = date.getTime();
  const jstDate = new Date(utcTime + JST_OFFSET_MINUTES * 60000);

  const year = jstDate.getFullYear();
  const month = String(jstDate.getMonth() + 1).padStart(2, '0');
  const day = String(jstDate.getDate()).padStart(2, '0');

  return `${year}/${month}/${day}`;
}

export function formatJSTDateTime(utcDateString: string): string {
  const date = new Date(utcDateString);
  const utcTime = date.getTime();
  const jstDate = new Date(utcTime + JST_OFFSET_MINUTES * 60000);

  const year = jstDate.getFullYear();
  const month = String(jstDate.getMonth() + 1).padStart(2, '0');
  const day = String(jstDate.getDate()).padStart(2, '0');
  const hours = String(jstDate.getHours()).padStart(2, '0');
  const minutes = String(jstDate.getMinutes()).padStart(2, '0');

  return `${year}/${month}/${day} ${hours}:${minutes}`;
}

export function convertToUTCDate(jstDateTimeString: string): string {
  const jstDate = new Date(jstDateTimeString);
  const utcDate = new Date(jstDate.getTime() - JST_OFFSET_MINUTES * 60000);
  return utcDate.toISOString();
}

export function convertDateToJST(utcDate: Date): Date {
  const utcTime = utcDate.getTime();
  return new Date(utcTime + JST_OFFSET_MINUTES * 60000);
}

export function convertDateToUTC(jstDate: Date): Date {
  return new Date(jstDate.getTime() - JST_OFFSET_MINUTES * 60000);
}

export function parseJSTDate(dateString: string): Date {
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const day = parseInt(parts[2]);
    return new Date(Date.UTC(year, month, day) + JST_OFFSET_MINUTES * 60000);
  }
  return new Date(dateString);
}

export function isSameJSTDate(date1: Date | string, date2: Date | string): boolean {
  const jstDate1 = typeof date1 === 'string' ? getJSTDate() : convertDateToJST(date1).toISOString().split('T')[0];
  const jstDate2 = typeof date2 === 'string' ? date2 : convertDateToJST(date2).toISOString().split('T')[0];
  return jstDate1 === jstDate2;
}

export function formatJSTDateTimeLocale(date?: Date): string {
  const jstDate = date ? convertDateToJST(date) : getJSTDateTime();
  return jstDate.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

export function parseJSTDateTimeLocale(dateString: string): string {
  const match = dateString.match(/(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})/);
  if (!match) {
    throw new Error('Invalid date format');
  }

  const [, year, month, day, hours, minutes] = match;
  const jstDate = new Date(`${year}-${month}-${day}T${hours}:${minutes}:00+09:00`);

  return jstDate.toISOString();
}

export function formatJSTDateLocale(date?: Date): string {
  const jstDate = date ? convertDateToJST(date) : getJSTDateTime();
  return jstDate.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

export function parseJSTDateLocale(dateString: string): string {
  const match = dateString.match(/(\d{4})\/(\d{2})\/(\d{2})/);
  if (!match) {
    throw new Error('Invalid date format');
  }

  const [, year, month, day] = match;
  return `${year}-${month}-${day}`;
}
