import { NextResponse } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const searchQuery = searchParams.get('search') || '';

  const urls = [
    'https://www.open-epg.com/files/turkey1.xml',
    'https://www.open-epg.com/files/turkey2.xml',
    'https://www.open-epg.com/files/turkey3.xml',
    'https://www.open-epg.com/files/turkey4.xml',
  ];

  const allOnAir: any[] = [];

  for (const url of urls) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) continue;
      
      const xml = await res.text();

      // Kanal isimleri - .tr ile biten format
      const channels: Record<string, string> = {};
      const chRegex = /<channel id="([^"]*)">\s*<display-name>([^<]*)<\/display-name>/g;
      let m;
      while ((m = chRegex.exec(xml)) !== null) {
        channels[m[1]] = m[2].trim();
      }

      // Şimdiki zaman - XML'deki format: 20260621193000 +0300
      const now = new Date();
      const offset = -now.getTimezoneOffset();
      const offsetHours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
      const offsetMins = String(Math.abs(offset) % 60).padStart(2, '0');
      const offsetSign = offset >= 0 ? '+' : '-';
      const pad = (n: number) => String(n).padStart(2, '0');
      const currentTime = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())} ${offsetSign}${offsetHours}${offsetMins}`;

      // Tüm programme bloklarını bul
      const blocks = xml.match(/<programme[\s\S]*?<\/programme>/g) || [];

      for (const block of blocks) {
        const start = block.match(/start="([^"]*)"/)?.[1];
        const stop = block.match(/stop="([^"]*)"/)?.[1];
        const chId = block.match(/channel="([^"]*)"/)?.[1];
        const title = block.match(/<title[^>]*>([^<]*)<\/title>/)?.[1];

        if (start && stop && title && chId && start <= currentTime && stop >= currentTime) {
          const chName = channels[chId] || chId.replace('.tr', '');
          
          if (searchQuery && !chName.toLowerCase().includes(searchQuery.toLowerCase()) && 
              !title.toLowerCase().includes(searchQuery.toLowerCase())) {
            continue;
          }
          
          allOnAir.push({ channel: chName, title: title.trim(), start, stop });
        }
      }
    } catch (e) { continue; }
  }

  allOnAir.sort((a, b) => a.channel.localeCompare(b.channel));

  return NextResponse.json({
    success: true,
    currentTime,
    total: allOnAir.length,
    searchQuery: searchQuery || null,
    onAir: allOnAir.slice(0, 100),
  });
}
