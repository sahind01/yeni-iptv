import { Channel, EPGData } from '@/types';

interface ParsedM3UItem {
  name: string;
  logo: string;
  group: string;
  url: string;
  tvgId?: string;
  tvgName?: string;
  epg?: EPGData;
}

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
    
    let currentItem: Partial<ParsedM3UItem> = {};
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // #EXTINF satırını işle
      if (line.startsWith('#EXTINF:')) {
        currentItem = this.parseExtinfLine(line);
      }
      // URL satırını işle
      else if (line.startsWith('http') || line.startsWith('https')) {
        if (currentItem.name) {
          const channel = this.createChannel(currentItem as ParsedM3UItem);
          channels.push(channel);
          currentItem = {};
        }
      }
      // EPG satırını işle
      else if (line.startsWith('#EXTVLCOPT:')) {
        // EPG seçeneklerini işle (opsiyonel)
      }
    }
    
    return channels;
  }

  private parseExtinfLine(line: string): Partial<ParsedM3UItem> {
    const item: Partial<ParsedM3UItem> = {};
    
    // tvg-id
    const tvgIdMatch = line.match(/tvg-id="([^"]*)"/);
    if (tvgIdMatch) item.tvgId = tvgIdMatch[1];
    
    // tvg-name
    const tvgNameMatch = line.match(/tvg-name="([^"]*)"/);
    if (tvgNameMatch) item.tvgName = tvgNameMatch[1];
    
    // tvg-logo
    const logoMatch = line.match(/tvg-logo="([^"]*)"/);
    if (logoMatch) item.logo = logoMatch[1];
    
    // group-title
    const groupMatch = line.match(/group-title="([^"]*)"/);
    if (groupMatch) item.group = groupMatch[1];
    
    // Kanal adı (virgülden sonraki kısım)
    const nameMatch = line.match(/,(.*)$/);
    if (nameMatch) {
      item.name = nameMatch[1].trim();
    }
    
    return item;
  }

  private createChannel(item: ParsedM3UItem): Channel {
    const name = item.tvgName || item.name || 'Bilinmeyen Kanal';
    
    // Kalite tespiti
    let quality: 'SD' | 'HD' | 'FHD' | '4K' = 'SD';
    const upperName = name.toUpperCase();
    if (upperName.includes('4K') || upperName.includes('UHD')) {
      quality = '4K';
    } else if (upperName.includes('FHD') || upperName.includes('1080')) {
      quality = 'FHD';
    } else if (upperName.includes('HD') || upperName.includes('720')) {
      quality = 'HD';
    }
    
    return {
      id: item.tvgId || this.generateId(name, item.url),
      name,
      logo: item.logo || '/icons/default-channel.png',
      url: item.url,
      group: item.group || 'Diğer',
      quality,
      tvgId: item.tvgId,
      tvgName: item.tvgName,
    };
  }

  private generateId(name: string, url: string): string {
    const str = `${name}-${url}`;
    return btoa(encodeURIComponent(str)).replace(/[/+=]/g, '_').substring(0, 32);
  }

  async fetchPlaylist(username: string, password: string): Promise<Channel[]> {
    const apiUrl = process.env.NEXT_PUBLIC_M3U_API_URL || 
                   'https://mutlu-iptv.vercel.app/api/m3u';
    
    try {
      const response = await fetch(
        `${apiUrl}?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/x-mpegurl, audio/x-mpegurl, */*',
          },
          cache: 'no-store', // Önbelleğe alma
        }
      );
      
      if (!response.ok) {
        throw new Error(`Playlist alınamadı: ${response.status}`);
      }
      
      const m3uContent = await response.text();
      
      if (!m3uContent.includes('#EXTM3U')) {
        throw new Error('Geçersiz M3U formatı');
      }
      
      return this.parse(m3uContent);
      
    } catch (error) {
      console.error('M3U fetch error:', error);
      throw new Error('Kanal listesi yüklenemedi. Lütfen bilgilerinizi kontrol edin.');
    }
  }
}
