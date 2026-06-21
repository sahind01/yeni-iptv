import { NextResponse } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await fetch('https://raw.githubusercontent.com/ahmethascelik/epghost/main/xmltv.xml');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();

    // XML'den ilk 10 programı direkt çek - hiçbir filtre yok
    const programmes: any[] = [];
    
    // programme bloklarını tek tek bul
    const blocks = xml.split('<programme ');
    
    for (let i = 1; i < Math.min(blocks.length, 20); i++) {
      const block = blocks[i];
      const startMatch = block.match(/start="([^"]*)"/);
      const stopMatch = block.match(/stop="([^"]*)"/);
      const channelMatch = block.match(/channel="([^"]*)"/);
      const titleMatch = block.match(/<title[^>]*>([^<]*)<\/title>/);
      
      if (startMatch && stopMatch && titleMatch) {
        // Kanal adını bul
        let channelName = channelMatch ? channelMatch[1] : 'unknown';
        const chBlock = xml.split(`id="${channelName}"`)[1];
        if (chBlock) {
          const displayMatch = chBlock.match(/<display-name[^>]*>([^<]*)<\/display-name>/);
          if (displayMatch) {
            channelName = displayMatch[1].trim().replace(/^TR:\s*/i, '');
          }
        }
        
        programmes.push({
          start: startMatch[1],
          stop: stopMatch[1],
          channel: channelName,
          title: titleMatch[1].trim(),
        });
      }
    }

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const currentTime = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())} +0000`;

    return NextResponse.json({
      success: true,
      currentTime,
      xmlLength: xml.length,
      programmeBlocks: blocks.length,
      sampleProgrammes: programmes,
    });

  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message });
  }
}
