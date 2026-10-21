/**
 * Date utilities strictly enforcing Bangladesh Standard Time (BST / UTC+6).
 */

export function getBangladeshNow(): Date {
  const now = new Date();
  // UTC time in ms + 6 hours
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 6 * 3600000);
}

export function getBangladeshDateString(date: Date = getBangladeshNow()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysToBangladeshDate(baseDateStr: string, daysToAdd: number): string {
  const [y, m, d] = baseDateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + daysToAdd);
  const resY = date.getUTCFullYear();
  const resM = String(date.getUTCMonth() + 1).padStart(2, '0');
  const resD = String(date.getUTCDate()).padStart(2, '0');
  return `${resY}-${resM}-${resD}`;
}

export function isDateOnOrBefore(targetDateStr: string, compareDateStr: string): boolean {
  return targetDateStr <= compareDateStr;
}

export function formatBangladeshDateTime(isoOrDate: string | Date): { date: string; time: string; full: string } {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  // Convert to UTC+6
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  const bstDate = new Date(utc + 6 * 3600000);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthsBn = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];

  const day = bstDate.getDate();
  const month = months[bstDate.getMonth()];
  const year = bstDate.getFullYear();

  let hours = bstDate.getHours();
  const minutes = String(bstDate.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;

  const dateFormatted = `${day} ${month} ${year}`;
  const timeFormatted = `${hours}:${minutes} ${ampm}`;

  return {
    date: dateFormatted,
    time: timeFormatted,
    full: `${dateFormatted}, ${timeFormatted} BST`,
  };
}
