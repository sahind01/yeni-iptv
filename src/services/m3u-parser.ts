import { Channel } from '@/types';

export class M3UParser {
  private static instance: M3UParser;

  static getInstance(): M3UParser {
    if (!M3UParser.instance) {
      M3UParser.instance = new M3UParser();
    }
    return M3UParser.instance;
  }

  parse(m3uContent: string): Channel[] {
    const channels: Channel[] = [];
    const lines = m3uContent.split('\n').map(line => line.trim());
    
    console.log('M3U Parse başladı, satır sayısı:', lines.length);
    console.log('İlk 5 satır:', lines.slice(0, 5));
    
    let currentChannel: Partial<Channel> = {};
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('#EXTINF:')) {
        // tvg-id
        const tvgIdMatch = line.match(/tvg-id="([^"]*)"/);
        // tvg-name
        const tvgNameMatch = line.match(/tvg-name="([^"]*)"/);
        // tvg-logo
        const logoMatch = line.match(/tvg-logo="([^"]*)"/);
        // group-title
        const groupMatch = line.match(/group-title="([^"]*)"/);
        // Kanal adı (virgülden sonrası)
        const nameParts = line.split(',');
        const displayName = nameParts.length > 1 ? nameParts[nameParts.length - 1].trim() : '';
        
        currentChannel = {
          id: tvgIdMatch?.[1] || this.generateId(displayName || `channel_${i}`),
          name: tvgNameMatch?.[1] || displayName || `Kanal ${i}`,
          logo: logoMatch?.[1] || '/icons/default-channel.png',
          group: groupMatch?.[1] || 'Diğer',
          quality: 'SD',
          tvgId: tvgIdMatch?.[1],
          tvgName: tvgNameMatch?.[1],
        };
        
        // Kalite tespiti
        const name = (currentChannel.name || '').toUpperCase();
        if (name.includes('4K') || name.includes('UHD')) currentChannel.quality = '4K';
        else if (name.includes('FHD') || name.includes('1080')) currentChannel.quality = 'FHD';
        else if (name.includes('HD') || name.includes('720')) currentChannel.quality = 'HD';
        
      } else if ((line.startsWith('http://') || line.startsWith('https://')) && currentChannel.name) {
        currentChannel.url = line;
        channels.push(currentChannel as Channel);
        currentChannel = {};
      }
    }
    
    console.log('Parse tamamlandı, kanal sayısı:', channels.length);
    if (channels.length > 0) {
      console.log('İlk kanal:', channels[0]);
    }
    
    return channels;
  }

  private generateId(name: string): string {
    return btoa(encodeURIComponent(name)).replace(/[/+=]/g, '_').substring(0, 32);
  }

  async fetchPlaylist(username: string, password: string): Promise<Channel[]> {
    const apiUrl = `https://mutlu-iptv.vercel.app/api/m3u?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
    
    console.log('M3U API çağrılıyor:', apiUrl);
    
    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: { 'Accept': '*/*' },
        cache: 'no-store',
      });
      
      console.log('API yanıt status:', response.status);
      
      if (!response.ok) {
        throw new Error(`API hatası: ${response.status} ${response.statusText}`);
      }
      
      const m3uContent = await response.text();
      console.log('M3U içerik uzunluğu:', m3uContent.length);
      console.log('İlk 200 karakter:', m3uContent.substring(0, 200));
      
      if (!m3uContent.includes('#EXTM3U')) {
        throw new Error('Geçersiz M3U formatı - #EXTM3U bulunamadı');
      }
      
      return this.parse(m3uContent);
      
    } catch (error: any) {
      console.error('M3U fetch hatası:', error);
      throw error;
    }
  }
}
