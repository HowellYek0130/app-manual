import type { Product, ProductBundle, SourceConfig, TrackingState, UpdateEntry } from './types';

const definitions = import.meta.glob('../products/*/product.json', { eager: true, import: 'default' });
const sources = import.meta.glob('../products/*/sources.json', { eager: true, import: 'default' });
const updates = import.meta.glob('../products/*/updates.json', { eager: true, import: 'default' });
const tracking = import.meta.glob('../products/*/tracking.json', { eager: true, import: 'default' });
export const catalog: ProductBundle[] = Object.entries(definitions).map(([path, value]) => {
  const folder = path.slice(0, path.lastIndexOf('/'));
  return {
    product: value as Product,
    sources: (sources[`${folder}/sources.json`] ?? []) as SourceConfig[],
    updates: (updates[`${folder}/updates.json`] ?? []) as UpdateEntry[],
    tracking: (tracking[`${folder}/tracking.json`] ?? { sources: {}, reviewControlIds: [] }) as TrackingState,
  };
}).sort((a, b) => a.product.id.localeCompare(b.product.id));

export function locateControl(bundle: ProductBundle, id?: string | null) {
  if (!id) return undefined;
  for (const screen of bundle.product.screens) {
    const control = screen.controls.find((item) => item.id === id);
    if (control) return { screen, control };
  }
}
export function evidenceFor(bundle: ProductBundle, id: string) {
  if (bundle.tracking.reviewControlIds.includes(id)) return 'needs-review';
  return locateControl(bundle, id)?.control.guide.evidence ?? 'needs-review';
}
