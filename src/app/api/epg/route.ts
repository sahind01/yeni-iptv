import { NextResponse } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await fetch('https://raw.githubusercontent.com/ahmethascelik/epghost/main/xmltv.xml');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();

    // Kanal isimleri
    const channels: Record<string, string> = {};
    const chRegex = /<channel id="([^"]*)"[^>]*>[\s\S]*?<display-name[^>]*>([^<]*)<\/display-name>/g;
    let m;
    while ((m = chRegex.exec(xml)) !== null) {
      let name = m[2].trim().replace(/^TR:\s*/i, '');
      channels[m[1]] = name;
    }

    // Test: ilk 3 programı al, zaman kontrolü YAPMADAN
    const programmes: any[] = [];
    const pRegex = /<programme start="([^"]*)" stop="([^"]*)" channel="([^"]*)"[^>]*>[\s\S]*?<title[^>]*>([^<]*)<\/title>/g;

    // Şu anki UTC zaman
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const currentTime = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())} +0000`;

    let firstStart = '';
    let firstStop = '';

    while ((m = pRegex.exec(xml)) !== null) {
      if (!firstStart) {
        firstStart = m[1];
        firstStop = m[2];
      }

      if (m[1] <= currentTime && m[2] >= currentTime) {
        programmes.push({
          channel: channels[m[3]] || m[3],
          title: m[4].trim(),
          start: m[1],
          stop: m[2],
        });
      }

      if (programmes.length >= 50) break;
    }

    return NextResponse.json({
      success: true,
      currentTime,
      firstProgrammeStart: firstStart,
      firstProgrammeStop: firstStop,
      total: programmes.length,
      onAir: programmes,
    });

  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message });
  }
}
