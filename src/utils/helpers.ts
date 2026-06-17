import { Channel } from '@/types';

export const helpers = {
  // Kanal ID oluşturma
  generateChannelId(name: string, url: string): string {
    const str = `${name}-${url}`;
    return btoa(str).replace(/[/+=]/g, '_').substring(0, 32);
  },

  // Kanal gruplandırma
  groupChannelsByCategory(channels: Channel[]): Map<string, Channel[]> {
    const groups = new Map<string, Channel[]>();
    
    channels.forEach(channel => {
      const group = channel.group || 'Diğer';
      if (!groups.has(group)) {
        groups.set(group, []);
      }
      groups.get(group)!.push(channel);
    });
    
    return groups;
  },

  // Kalite etiketi belirleme
  getQualityLabel(channel: Channel): string {
    const name = channel.name.toUpperCase();
    if (name.includes('4K') || name.includes('UHD')) return '4K';
    if (name.includes('FHD') || name.includes('1080P')) return 'FHD';
    if (name.includes('HD') || name.includes('720P')) return 'HD';
    return channel.quality || 'SD';
  },

  // Zaman formatlama
  formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  },

  // Tarih formatlama
  formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Az önce';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} dk önce`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} saat önce`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} gün önce`;
    
    return date.toLocaleDateString('tr-TR');
  },

  // Arama filtreleme
  filterChannels(channels: Channel[], query: string): Channel[] {
    const searchTerm = query.toLowerCase().trim();
    if (!searchTerm) return channels;
    
    return channels.filter(channel =>
      channel.name.toLowerCase().includes(searchTerm) ||
      channel.group.toLowerCase().includes(searchTerm)
    );
  },
};
