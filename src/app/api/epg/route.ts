import { NextResponse } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await fetch('https://raw.githubusercontent.com/ahmethascelik/epghost/main/xmltv.xml');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();

    // Program bloklarını bul - XML'de <programme> diye aranacak
    const programmeMatches = xml.match(/<programme[\s\S]*?<\/programme>/g);
    
    if (!programmeMatches || programmeMatches.length === 0) {
      return NextResponse.json({ success: false, error: 'Hiç program bulunamadı', xmlLength: xml.length });
    }

    // Kanal isimlerini çıkar
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

    for (const block of programmeMatches) {
      const startMatch = block.match(/start="([^"]*)"/);
      const stopMatch = block.match(/stop="([^"]*)"/);
      const channelMatch = block.match(/channel="([^"]*)"/);
      const titleMatch = block.match(/<title[^>]*>([^<]*)<\/title>/);

      if (startMatch && stopMatch && titleMatch && channelMatch) {
        const start = startMatch[1];
        const stop = stopMatch[1];
        
        if (start <= currentTime && stop >= currentTime) {
          onAir.push({
            channel: channels[channelMatch[1]] || channelMatch[1],
            title: titleMatch[1].trim(),
            start,
            stop,
          });
        }
      }

      if (onAir.length >= 50) break;
    }

    return NextResponse.json({
      success: true,
      currentTime,
      totalProgrammes: programmeMatches.length,
      onAir,
    });

  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message });
  }
}
