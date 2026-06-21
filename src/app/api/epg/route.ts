import { NextResponse } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET() {
  const urls = [
    'https://www.open-epg.com/files/turkey1.xml',
    'https://www.open-epg.com/files/turkey2.xml',
    'https://www.open-epg.com/files/turkey3.xml',
    'https://www.open-epg.com/files/turkey4.xml',
    'https://epgshare01.online/epgshare01/epg_ripper_TR1.xml.gz',
    'https://epgshare01.online/epgshare01/epg_ripper_TR3.xml.gz',
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) continue;
      
      let xml = await res.text();
      
      // .gz dosyasıysa açmayı dene (basit kontrol)
      if (url.endsWith('.gz')) {
        try {
          const decompressed = new Response(res.body?.pipeThrough(new DecompressionStream('gzip')));
          xml = await decompressed.text();
        } catch (e) {
          continue;
        }
      }

      // programme tag'lerini bul
      if (!xml.includes('<programme')) continue;

      // Kanal isimleri
      const channels: Record<string, string> = {};
      const chRegex = /<channel id="([^"]*)"[^>]*>[\s\S]*?<display-name[^>]*>([^<]*)<\/display-name>/g;
      let m;
      while ((m = chRegex.exec(xml)) !== null) {
        channels[m[1]] = m[2].trim().replace(/^TR:\s*/i, '');
      }

      // Şimdiki zaman
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const currentTime = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())} +0000`;

      const onAir: any[] = [];
      const blocks = xml.match(/<programme[\s\S]*?<\/programme>/g) || [];

      for (const block of blocks) {
        const start = block.match(/start="([^"]*)"/)?.[1];
        const stop = block.match(/stop="([^"]*)"/)?.[1];
        const chId = block.match(/channel="([^"]*)"/)?.[1];
        const title = block.match(/<title[^>]*>([^<]*)<\/title>/)?.[1];

        if (start && stop && title && chId && start <= currentTime && stop >= currentTime) {
          onAir.push({
            channel: channels[chId] || chId,
            title: title.trim(),
            start,
            stop,
          });
        }
        if (onAir.length >= 50) break;
      }

      if (onAir.length > 0) {
        return NextResponse.json({ success: true, source: url, onAir });
      }

    } catch (e) {
      continue;
    }
  }

  return NextResponse.json({ success: false, error: 'Hiçbir kaynaktan veri alınamadı' });
}
