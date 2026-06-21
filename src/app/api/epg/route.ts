import { NextResponse } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await fetch('https://raw.githubusercontent.com/Dodoizm35/epg-turkish/main/epg/index.xml');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();

    // Debug
    console.log('XML uzunluğu:', xml.length);
    console.log('İlk 1000 karakter:', xml.substring(0, 1000));

    // TÜM PROGRAMLARI AL - zaman filtresi olmadan
    const programmes: any[] = [];
    const pRegex = /<programme start="([^"]*)" stop="([^"]*)" channel="([^"]*)"[^>]*>[\s\S]*?<title[^>]*>([^<]*)<\/title>/g;
    let m;
    let count = 0;

    while ((m = pRegex.exec(xml)) !== null) {
      programmes.push({
        start: m[1],
        stop: m[2],
        channel: m[3],
        title: m[4].trim(),
      });
      count++;
      if (count >= 10) break;
    }

    console.log('İlk 10 program:', JSON.stringify(programmes, null, 2));

    return NextResponse.json({
      success: true,
      xmlLength: xml.length,
      xmlStart: xml.substring(0, 1000),
      totalProgrammesFound: count,
      sampleProgrammes: programmes,
    });

  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message });
  }
}
