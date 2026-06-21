import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://raw.githubusercontent.com/Dodoizm35/epg-turkish/main/epg/index.xml', {
      signal: AbortSignal.timeout(10000)
    });
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const xml = await res.text();
    
    const channels: Record<string, string> = {};
    const chRegex = /<channel id="([^"]*)"[^>]*>[\s\S]*?<display-name[^>]*>([^<]*)<\/display-name>/g;
    let m;
    while ((m = chRegex.exec(xml)) !== null) {
      channels[m[1]] = m[2].trim();
    }
    
    const now = new Date();
    const currentTime = now.toISOString();
    const programmes: any[] = [];
    const pRegex = /<programme start="([^"]*)" stop="([^"]*)" channel="([^"]*)"[^>]*>[\s\S]*?<title[^>]*>([^<]*)<\/title>/g;
    
    while ((m = pRegex.exec(xml)) !== null) {
      if (m[1] <= currentTime && m[2] >= currentTime) {
        programmes.push({
          channel: channels[m[3]] || m[3],
          title: m[4].trim(),
          start: m[1],
          stop: m[2],
        });
      }
      if (programmes.length > 5000) break;
    }
    
    return NextResponse.json({ success: true, total: programmes.length, onAir: programmes.slice(0, 50) });
    
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message });
  }
}
