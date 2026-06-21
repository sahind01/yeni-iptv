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
      if (!xml.includes('<programme')) continue;

      // Kanal isimleri
      const channels: Record<string, string> = {};
      const chRegex = /<channel id="([^"]*)"[^>]*>[\s\S]*?<display-name[^>]*>([^<]*)<\/display-name>/g;
      let m;
      while ((m = chRegex.exec(xml)) !== null) {
        channels[m[1]] = m[2].trim().replace(/^TR:\s*/i, '');
      }

      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const currentTime = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())} +0000`;

      const blocks = xml.match(/<programme[\s\S]*?<\/programme>/g) || [];

      for (const block of blocks) {
        const start = block.match(/start="([^"]*)"/)?.[1];
        const stop = block.match(/stop="([^"]*)"/)?.[1];
        const chId = block.match(/channel="([^"]*)"/)?.[1];
        const title = block.match(/<title[^>]*>([^<]*)<\/title>/)?.[1];

        if (start && stop && title && chId && start <= currentTime && stop >= currentTime) {
          const chName = channels[chId] || chId;
          
          // Arama filtresi
          if (searchQuery && !chName.toLowerCase().includes(searchQuery.toLowerCase()) && 
              !title.toLowerCase().includes(searchQuery.toLowerCase())) {
            continue;
          }
          
          allOnAir.push({ channel: chName, title: title.trim(), start, stop });
        }
      }
    } catch (e) { continue; }
  }

  // Kanala göre sırala
  allOnAir.sort((a, b) => a.channel.localeCompare(b.channel));

  return NextResponse.json({
    success: true,
    total: allOnAir.length,
    searchQuery: searchQuery || null,
    onAir: allOnAir.slice(0, 100),
  });
}
