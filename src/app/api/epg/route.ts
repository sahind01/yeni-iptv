import { NextResponse } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 50000);

    const res = await fetch('https://raw.githubusercontent.com/Dodoizm35/epg-turkish/main/epg/index.xml', {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const xml = await res.text();

    // Debug: ilk 500 karakteri logla
    console.log('XML başlangıcı:', xml.substring(0, 500));
    console.log('XML uzunluğu:', xml.length);
    console.log('channel var mı:', xml.includes('<channel'));
    console.log('programme var mı:', xml.includes('<programme'));

    const channels: Record<string, string> = {};
    const chRegex = /<channel id="([^"]*)"[^>]*>[\s\S]*?<display-name[^>]*>([^<]*)<\/display-name>/g;
    let m;
    while ((m = chRegex.exec(xml)) !== null) {
      channels[m[1]] = m[2].trim();
    }

    console.log('Bulunan kanal sayısı:', Object.keys(channels).length);
    console.log('İlk 3 kanal:', Object.entries(channels).slice(0, 3));

    // Şimdiki zamanı farklı formatlarda dene
    const now = new Date();
    const formats = [
      now.toISOString(),
      now.toISOString().replace('Z', '+00:00'),
      now.toISOString().replace('Z', '+03:00'),
      now.toISOString().replace(/\.\d{3}Z$/, '+03:00'),
    ];

    const programmes: any[] = [];
    const pRegex = /<programme start="([^"]*)" stop="([^"]*)" channel="([^"]*)"[^>]*>[\s\S]*?<title[^>]*>([^<]*)<\/title>/g;

    // İlk 5 programı debug için al
    let debugCount = 0;
    while ((m = pRegex.exec(xml)) !== null) {
      if (debugCount < 5) {
        console.log(`Program ${debugCount}: start=${m[1]}, stop=${m[2]}, title=${m[4]}, currentTime=${formats[0]}`);
        debugCount++;
      }

      for (const ft of formats) {
        if (m[1] <= ft && m[2] >= ft) {
          programmes.push({
            channel: channels[m[3]] || m[3],
            title: m[4].trim(),
            start: m[1],
            stop: m[2],
          });
          break;
        }
      }

      if (programmes.length > 3000) break;
    }

    console.log('Bulunan program sayısı:', programmes.length);
    console.log('İlk 3 program:', programmes.slice(0, 3));

    return NextResponse.json({
      success: true,
      total: programmes.length,
      channelCount: Object.keys(channels).length,
      currentTime: formats[0],
      sampleProgrammes: programmes.slice(0, 3),
      onAir: programmes.slice(0, 50),
    });

  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message });
  }
}
