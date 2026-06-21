import { NextResponse } from 'next/server';

export async function GET() {
  // Manuel popüler kanal verisi - API çalışana kadar
  const fallbackData = {
    success: true,
    onAir: [
      { channel: 'TRT 1', title: 'Ana Haber Bülteni', start: '19:00', stop: '20:00' },
      { channel: 'Star TV', title: 'Yalı Çapkını', start: '20:00', stop: '23:00' },
      { channel: 'ATV', title: 'Kuruluş Osman', start: '20:00', stop: '23:00' },
      { channel: 'Kanal D', title: 'Arka Sokaklar', start: '20:00', stop: '23:00' },
      { channel: 'Show TV', title: 'Kızılcık Şerbeti', start: '20:00', stop: '23:00' },
      { channel: 'FOX', title: 'Yabancı Damat', start: '20:00', stop: '23:00' },
      { channel: 'TV8', title: 'MasterChef Türkiye', start: '20:00', stop: '00:00' },
      { channel: 'beIN Sports 1', title: 'Süper Lig Maçı', start: '20:00', stop: '22:00' },
      { channel: 'beIN Sports 2', title: 'Premier Lig', start: '20:00', stop: '22:00' },
      { channel: 'CNN Türk', title: 'Ana Haber', start: '19:00', stop: '20:00' },
      { channel: 'NTV', title: 'Haber Bülteni', start: '19:00', stop: '20:00' },
      { channel: 'A Spor', title: 'Spor Gündemi', start: '20:00', stop: '22:00' },
    ]
  };

  return NextResponse.json(fallbackData);
}
