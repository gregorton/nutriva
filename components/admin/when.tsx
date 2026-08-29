/*
  A timestamp on the dashboard, always in Bangkok time.

  Pinned to the zone rather than left to the runtime's, because the counters bucket on Bangkok days
  and a Netlify function runs in UTC — a signup at 06:30 Thai time would otherwise print as the
  previous evening and disagree with the bar it is counted in.
*/
const stamp = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Asia/Bangkok",
});

export function When({ iso }: { iso: string }) {
  return <time dateTime={iso}>{stamp.format(new Date(iso))}</time>;
}
