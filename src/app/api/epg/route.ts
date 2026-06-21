import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://www.open-epg.com/app/download.php?file=turkey3.xml', {
      signal: AbortSignal.timeout(15000)
    });
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const xml = await res.text();
    
    // Kanal isimlerini çıkar
    const channels: Record<string, string> = {};
    const channelRegex = /<channel id="([^"]*)"[^>]*>[\s\S]*?<display-name[^>]*>([^<]*)<\/display-name>/g;
    let match;
    while ((match = channelRegex.exec(xml)) !== null) {
      channels[match[1]] = match[2].trim();
    }
    
    const now = new Date();
    // +03:00 zaman dilimi için düzelt
    const currentTime = new Date(now.getTime() + (3 * 60 * 60 * 1000)).toISOString().replace('Z', '+03:00');
    const currentTimeUTC = now.toISOString();
    
    const programmes: any[] = [];
    const progRegex = /<programme start="([^"]*)" stop="([^"]*)" channel="([^"]*)"[^>]*>[\s\S]*?<title[^>]*>([^<]*)<\/title>/g;
    
    while ((match = progRegex.exec(xml)) !== null) {
      const startTime = match[1];
      const stopTime = match[2];
      
      // Zaman karşılaştırması - hem UTC hem +03:00 dene
      if ((startTime <= currentTime && stopTime >= currentTime) || 
          (startTime <= currentTimeUTC && stopTime >= currentTimeUTC)) {
        programmes.push({
          channel: channels[match[3]] || match[3],
          start: startTime,
          stop: stopTime,
          title: match[4].trim()
        });
      }
      
      if (programmes.length > 5000) break;
    }
    
    // Popüler kanal anahtar kelimeleri - EPG'deki gerçek isimler
    const keywords = ['TRT', 'ATV', 'STAR', 'KANAL D', 'SHOW', 'FOX', 'TV8', 'BEIN', 'A SPOR', 'CNN', 'NTV', 'HABERTÜRK', 'A HABER', 'BLOOMBERG', 'EURO SPORT', 'S SPORT', 'TIVIBU', 'D SMART'];
    
    const filtered = programmes.filter(p => 
      keywords.some(k => p.channel.toUpperCase().includes(k))
    );
    
    return NextResponse.json({
      success: true,
      totalAll: programmes.length,
      totalFiltered: filtered.length,
      onAir: filtered.slice(0, 30),
    });
    
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message });
  }
}
