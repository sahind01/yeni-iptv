import { NextResponse } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await fetch('https://raw.githubusercontent.com/ahmethascelik/epghost/main/xmltv.xml');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();

    // Kanal isimleri - TR: ile başlayanları temizle
    const channels: Record<string, string> = {};
    const chRegex = /<channel id="([^"]*)"[^>]*>[\s\S]*?<display-name[^>]*>([^<]*)<\/display-name>/g;
    let m;
    while ((m = chRegex.exec(xml)) !== null) {
      let name = m[2].trim();
      // "TR: " kısmını kaldır, sadece kanal adını al
      name = name.replace(/^TR:\s*/i, '');
      channels[m[1]] = name;
    }

    // Şimdiki zamanı XML formatına çevir: 20260621180900 +0000
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hour = String(now.getUTCHours()).padStart(2, '0');
    const min = String(now.getUTCMinutes()).padStart(2, '0');
    const sec = String(now.getUTCSeconds()).padStart(2, '0');
    const currentTime = `${year}${month}${day}${hour}${min}${sec} +0000`;

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

    return NextResponse.json({
      success: true,
      currentTime: currentTime,
      total: programmes.length,
      onAir: programmes.slice(0, 50),
    });

  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message });
  }
}
