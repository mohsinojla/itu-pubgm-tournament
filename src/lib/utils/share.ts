export function whatsappShare(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function teamShareText(teamName: string, url: string): string {
  return `🎮 Join "${teamName}" for the ITU × PUBGM Supremacy Cup!\n${url}`;
}
