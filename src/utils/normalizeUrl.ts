
export function normalizeUrl(url: string): string {
  let normalized = url.trim();
  
  // Remove protocol
  normalized = normalized.replace(/^(https?:\/\/)?(www\.)?/, '');
  
  // Remove trailing slash
  normalized = normalized.replace(/\/$/, '');
  
  return normalized;
}