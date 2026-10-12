export type Tab = 'guide' | 'updates' | 'differences' | 'review' | 'coverage';
export interface Route { productId?: string; tab: Tab; screenId?: string; controlId?: string }
export function parseRoute(hash: string): Route {
  const [path, search = ''] = hash.replace(/^#/, '').split('?');
  const parts = path.split('/').filter(Boolean).map((part) => { try { return decodeURIComponent(part); } catch { return ''; } });
  if (parts[0] !== 'products' || !parts[1]) return { tab: 'guide' };
  const tabs: Tab[] = ['guide', 'updates', 'differences', 'review', 'coverage'];
  return { productId: parts[1], tab: tabs.includes(parts[2] as Tab) ? parts[2] as Tab : 'guide', screenId: parts[3], controlId: new URLSearchParams(search).get('control') || undefined };
}
export function routeHash(route: Route) {
  if (!route.productId) return '#/';
  const path = ['products', route.productId, route.tab, ...(route.tab === 'guide' && route.screenId ? [route.screenId] : [])].map(encodeURIComponent).join('/');
  return `#/${path}${route.controlId ? `?control=${encodeURIComponent(route.controlId)}` : ''}`;
}
