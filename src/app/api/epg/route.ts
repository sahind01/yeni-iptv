import { NextResponse } from 'next/server';
import { gunzipSync } from 'zlib';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const searchQuery = searchParams.get('search') || '';

  try {
    const res = await fetch('https://iptv-epg.org/files/epg-tr.xml.gz', {
      signal: AbortSignal.timeout(20000)
    });
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const buffer = await res.arrayBuffer();
    const xml = gunzipSync(new Uint8Array(buffer)).toString('utf-8');

    // Kanal isimleri
    const channels: Record<string, string> = {};
    const chRegex = /<channel id="([^"]*)">\s*<display-name>([^<]*)<\/display-name>/g;
    let m;
    while ((m = chRegex.exec(xml)) !== null) {
      channels[m[1]] = m[2].trim();
    }

    // Şimdiki zaman
    const now = new Date();
    const offset = -now.getTimezoneOffset();
    const oh = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
    const om = String(Math.abs(offset) % 60).padStart(2, '0');
    const os = offset >= 0 ? '+' : '-';
    const pad = (n: number) => String(n).padStart(2, '0');
    const currentTime = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())} ${os}${oh}${om}`;

    const allOnAir: any[] = [];
    const blocks = xml.match(/<programme[\s\S]*?<\/programme>/g) || [];

    for (const block of blocks) {
      const start = block.match(/start="([^"]*)"/)?.[1];
      const stop = block.match(/stop="([^"]*)"/)?.[1];
      const chId = block.match(/channel="([^"]*)"/)?.[1];
      const title = block.match(/<title[^>]*>([^<]*)<\/title>/)?.[1];

      if (start && stop && title && chId && start <= currentTime && stop >= currentTime) {
        const chName = channels[chId] || chId;
        
        if (searchQuery && !chName.toLowerCase().includes(searchQuery.toLowerCase()) && 
            !title.toLowerCase().includes(searchQuery.toLowerCase())) continue;
        
        allOnAir.push({ channel: chName, title: title.trim(), start, stop });
      }
    }

    allOnAir.sort((a, b) => a.channel.localeCompare(b.channel));

    return NextResponse.json({
      success: true,
      currentTime,
      total: allOnAir.length,
      onAir: allOnAir.slice(0, 100),
    });

  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message });
  }
}
