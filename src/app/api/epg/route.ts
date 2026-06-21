import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://raw.githubusercontent.com/Dodoizm35/epg-turkish/main/epg/index.xml', {
      signal: AbortSignal.timeout(10000)
    });
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    
    const now = new Date();
    const currentTime = now.toISOString();
    
    const onAir: any[] = [];
    
    // Tüm kanalları tara
    for (const channel of data.channels || []) {
      const channelName = channel.name || channel.id || 'Bilinmiyor';
      
      // Sadece popüler kanalları al
      const popularKeywords = ['TRT', 'ATV', 'STAR', 'KANAL D', 'SHOW', 'FOX', 'TV8', 'BEIN', 'A SPOR', 'CNN', 'NTV', 'HABERTÜRK', 'BLOOMBERG', 'EURO', 'S SPOR', 'TIVIBU', 'D SMART'];
      const isPopular = popularKeywords.some(k => channelName.toUpperCase().includes(k));
      
      if (!isPopular) continue;
      
      for (const programme of channel.programs || []) {
        if (programme.start <= currentTime && programme.stop >= currentTime) {
          onAir.push({
            channel: channelName,
            title: programme.title || 'Bilinmiyor',
            start: programme.start,
            stop: programme.stop,
          });
          break;
        }
      }
      
      if (onAir.length >= 30) break;
    }
    
    if (onAir.length === 0) {
      return NextResponse.json({ success: false, error: 'Şu an yayın bulunamadı' });
    }
    
    return NextResponse.json({ success: true, onAir });
    
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message });
  }
}
