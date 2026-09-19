/**
 * Converts SRT subtitle string content to WebVTT format and creates a Blob URL.
 */
export function srtToVttBlobUrl(srtContent: string, offsetSeconds: number = 0): string {
  // Convert SRT line breaks to standard \n
  let content = srtContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Convert comma timecode (00:00:00,000) to WebVTT dot format (00:00:00.000) and apply offset if needed
  if (offsetSeconds !== 0) {
    content = content.replace(
      /(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/g,
      (_match, h1, m1, s1, ms1, h2, m2, s2, ms2) => {
        const t1 = applyTimeOffset(h1, m1, s1, ms1, offsetSeconds);
        const t2 = applyTimeOffset(h2, m2, s2, ms2, offsetSeconds);
        return `${t1} --> ${t2}`;
      }
    );
  } else {
    content = content.replace(
      /(\d{2}:\d{2}:\d{2})[,.](\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2})[,.](\d{3})/g,
      '$1.$2 --> $3.$4'
    );
  }

  const vttContent = `WEBVTT\n\n${content}`;
  const blob = new Blob([vttContent], { type: 'text/vtt;charset=utf-8' });
  return URL.createObjectURL(blob);
}

function applyTimeOffset(h: string, m: string, s: string, ms: string, offsetSec: number): string {
  let totalMs =
    parseInt(h, 10) * 3600000 +
    parseInt(m, 10) * 60000 +
    parseInt(s, 10) * 1000 +
    parseInt(ms, 10);

  totalMs = Math.max(0, totalMs + Math.round(offsetSec * 1000));

  const newH = Math.floor(totalMs / 3600000);
  totalMs %= 3600000;
  const newM = Math.floor(totalMs / 60000);
  totalMs %= 60000;
  const newS = Math.floor(totalMs / 1000);
  const newMs = totalMs % 1000;

  const pad = (n: number, z = 2) => String(n).padStart(z, '0');
  return `${pad(newH)}:${pad(newM)}:${pad(newS)}.${pad(newMs, 3)}`;
}
