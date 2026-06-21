import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://www.open-epg.com/app/download.php?file=turkey3.xml');
    if (!res.ok) throw new Error('EPG alınamadı');
    
    const xml = await res.text();
    
    // Tüm kanal isimlerini çıkar
    const channels: Record<string, string> = {};
    const channelRegex = /<channel id="([^"]*)"[^>]*>[\s\S]*?<display-name[^>]*>([^<]*)<\/display-name>/g;
    let match;
    while ((match = channelRegex.exec(xml)) !== null) {
      channels[match[1]] = match[2].trim();
    }
    
    const now = new Date();
    const currentTime = now.toISOString();
    
    // TÜM şu anki yayınları çıkar - FİLTRE YOK
    const programmes: any[] = [];
    const progRegex = /<programme start="([^"]*)" stop="([^"]*)" channel="([^"]*)"[^>]*>[\s\S]*?<title[^>]*>([^<]*)<\/title>/g;
    
    while ((match = progRegex.exec(xml)) !== null) {
      if (match[1] <= currentTime && match[2] >= currentTime) {
        programmes.push({
          channel: channels[match[3]] || match[3],
          start: match[1],
          stop: match[2],
          title: match[4].trim()
        });
      }
      if (programmes.length > 5000) break;
    }
    
    return NextResponse.json({
      success: true,
      total: programmes.length,
      onAir: programmes.slice(0, 50),
      sampleChannels: Object.values(channels).slice(0, 20)
    });
    
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message });
  }
}
