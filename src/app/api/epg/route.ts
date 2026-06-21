import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://www.open-epg.com/app/download.php?file=turkey3.xml', {
      signal: AbortSignal.timeout(15000) // 15 saniye timeout
    });
    
    if (!res.ok) {
      return NextResponse.json({ 
        success: false, 
        error: `HTTP ${res.status}: ${res.statusText}` 
      });
    }
    
    const xml = await res.text();
    
    return NextResponse.json({
      success: true,
      xmlSize: xml.length,
      firstChars: xml.substring(0, 500),
      hasChannels: xml.includes('<channel'),
      hasProgrammes: xml.includes('<programme'),
    });
    
  } catch (e: any) {
    return NextResponse.json({ 
      success: false, 
      error: e.message,
      errorName: e.name
    });
  }
}
