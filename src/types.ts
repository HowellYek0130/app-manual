export type EvidenceStatus = 'documented' | 'ui-verified' | 'needs-review';
export interface Guide {
  purpose: string;
  steps: string[];
  outcome: string;
  conditions: string;
  troubleshooting: string;
  sourceIds: string[];
  evidence: EvidenceStatus;
  verifiedAt: string;
  keywords?: string[];
}
export interface Control {
  id: string;
  label: string;
  icon?: string;
  placement?: 'sidebar' | 'toolbar' | 'composer' | 'content' | 'tab';
  action: { kind: 'navigate' | 'notice' | 'toggle' | 'submit' | 'back'; target?: string; result?: string };
  guide: Guide;
}
export interface Screen {
  id: string;
  title: string;
  section: string;
  layout: 'chat' | 'settings' | 'workspace' | 'dialog' | 'list' | 'detail';
  parentId?: string;
  description: string;
  controls: Control[];
}
export interface Product {
  id: string;
  name: string;
  plan: string;
  platform: string;
  versionLabel: string;
  accent: string;
  intro: string;
  initialScreen: string;
  screens: Screen[];
  tours: { id: string; title: string; description: string; controlIds: string[] }[];
  differences: { title: string; before: string; now: string; sourceIds: string[] }[];
}
export interface SourceConfig {
  id: string;
  title: string;
  url: string;
  kind: 'release-notes' | 'article' | 'rss' | 'announcements';
  selector?: string;
  keywords?: string[];
}
export interface UpdateEntry {
  id: string;
  sourceId: string;
  title: string;
  url: string;
  publishedAt: string | null;
  detectedAt: string;
  type: 'new' | 'edited' | 'documentation' | 'baseline';
  controlIds: string[];
  summaryZh?: string;
  interpretation: 'pending' | 'reviewed';
}
export interface SourceState {
  hash?: string;
  entries?: { id: string; title: string; publishedAt: string | null; hash: string; url: string }[];
  lastEntryCount?: number;
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
  status: 'ok' | 'error' | 'pending';
  error?: string;
}
export interface TrackingState {
  sources: Record<string, SourceState>;
  reviewControlIds: string[];
}
export interface ProductBundle {
  product: Product;
  sources: SourceConfig[];
  updates: UpdateEntry[];
  tracking: TrackingState;
}
