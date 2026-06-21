import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://www.open-epg.com/app/download.php?file=turkey3.xml');
    if (!res.ok) throw new Error('EPG alınamadı');
    
    const xml = await res.text();
    
    // Kanalları çıkar
    const channels: Record<string, string> = {};
    const channelRegex = /<channel id="([^"]*)"[^>]*>[\s\S]*?<display-name[^>]*>([^<]*)<\/display-name>/g;
    let match;
    while ((match = channelRegex.exec(xml)) !== null) {
      channels[match[1]] = match[2].trim();
    }
    
    // Şu an yayında olan programları çıkar
    const now = new Date();
    const currentTime = now.toISOString();
    const programmes: any[] = [];
    const progRegex = /<programme start="([^"]*)" stop="([^"]*)" channel="([^"]*)"[^>]*>[\s\S]*?<title[^>]*>([^<]*)<\/title>/g;
    
    while ((match = progRegex.exec(xml)) !== null) {
      if (match[1] <= currentTime && match[2] >= currentTime) {
        const chName = channels[match[3]] || match[3];
        programmes.push({
          channel: chName,
          start: match[1],
          stop: match[2],
          title: match[4].trim()
        });
      }
      if (programmes.length > 2000) break;
    }
    
    // Popüler kanalları filtrele
    const keywords = ['TRT', 'Star', 'ATV', 'Kanal D', 'Show', 'FOX', 'TV8', 'beIN', 'S Sport', 'Tivibu', 'A Spor', 'CNN', 'NTV', 'Habertürk', 'Euro Sport'];
    const filtered = programmes.filter(p => keywords.some(k => p.channel.toLowerCase().includes(k.toLowerCase())));
    
    return NextResponse.json({ success: true, onAir: filtered.slice(0, 30) });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message });
  }
}
