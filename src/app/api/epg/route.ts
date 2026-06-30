import { NextResponse } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await fetch('https://mutluepg.vercel.app/', {
      signal: AbortSignal.timeout(15000)
    });
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    
    return NextResponse.json(data);
    
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message });
  }
}
