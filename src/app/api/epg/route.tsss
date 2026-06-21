import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://www.open-epg.com/app/download.php?file=turkey3.xml', {
      next: { revalidate: 600 } // 10 dk cache
    });
    
    if (!res.ok) throw new Error('EPG alınamadı');
    
    const xml = await res.text();
    
    // Kanal isimlerini çıkar
    const channels: Record<string, string> = {};
    const channelRegex = /<channel id="([^"]*)">[\s\S]*?<display-name[^>]*>([^<]*)<\/display-name>/g;
    let match;
    while ((match = channelRegex.exec(xml)) !== null) {
      channels[match[1]] = match[2].trim();
    }
    
    // Programları çıkar
    const programmes: any[] = [];
    const programmeRegex = /<programme start="([^"]*)" stop="([^"]*)" channel="([^"]*)">[\s\S]*?<title[^>]*>([^<]*)<\/title>/g;
    
    const now = new Date();
    const currentTime = now.toISOString();
    
    while ((match = programmeRegex.exec(xml)) !== null) {
      const startTime = match[1];
      const stopTime = match[2];
      const channelId = match[3];
      const title = match[4].trim();
      const channelName = channels[channelId] || channelId;
      
      // Şu an yayında olanlar
      if (startTime <= currentTime && stopTime >= currentTime) {
        programmes.push({
          channel: channelName,
          start: startTime,
          stop: stopTime,
          title: title,
        });
      }
      
      if (programmes.length > 500) break;
    }
    
    // Popüler kanalları filtrele
    const popularKeywords = ['TRT', 'Star', 'ATV', 'Kanal D', 'Show', 'FOX', 'TV8', 'beIN', 'S Sport', 'Tivibu', 'D Smart', 'Euro Sport', 'Spor Smart', 'A Spor', 'CNN', 'Haber', 'NTV', 'Habertürk'];
    const popularOnAir = programmes.filter(p => popularKeywords.some(k => p.channel.toLowerCase().includes(k.toLowerCase())));
    
    return NextResponse.json({
      success: true,
      count: popularOnAir.length,
      onAir: popularOnAir.slice(0, 30),
      updated: new Date().toISOString(),
    });
    
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
