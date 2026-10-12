import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { driver } from 'driver.js';
import type { Driver } from 'driver.js';
import { ArrowLeft, ArrowRight, ArrowUp, BookOpen, Check, CheckCircle2, ChevronDown, ChevronRight, CircleHelp, ClipboardList, Clock3, Code2, Compass, ExternalLink, FileText, Folder, History, Info, Layers, Link2, List, Menu, MessageCircle, Monitor, MoreHorizontal, Newspaper, Paperclip, Play, Plus, Search, Settings, ShieldCheck, Sparkles, WandSparkles, X } from 'lucide-react';
import { catalog, evidenceFor, locateControl } from './catalog';
import { parseRoute, routeHash } from './routing';
import type { Route, Tab } from './routing';
import type { Control, ProductBundle, Screen } from './types';
import { readLearning, saveLearning } from './storage';

const tabs: { id: Tab; label: string; icon: typeof BookOpen }[] = [
  { id: 'guide', label: '操作手册', icon: BookOpen }, { id: 'updates', label: '官方更新', icon: Newspaper },
  { id: 'differences', label: '新旧用法', icon: History }, { id: 'review', label: '待核验', icon: ClipboardList }, { id: 'coverage', label: '界面清单', icon: Layers },
];
const icons: Record<string, typeof BookOpen> = { plus: Plus, search: Search, settings: Settings, folder: Folder, chat: MessageCircle, message: MessageCircle, paperclip: Paperclip, attachment: Paperclip, send: ArrowUp, arrow: ArrowRight, more: MoreHorizontal, menu: Menu, chevron: ChevronDown, code: Code2, monitor: Monitor, link: Link2, shield: ShieldCheck, sparkles: Sparkles, play: Play, file: FileText, book: BookOpen, globe: Compass, brain: WandSparkles };
const evidenceText = { documented: '官方文档支持', 'ui-verified': '实际界面已核验', 'needs-review': '待核验' };
const date = (value?: string | null) => value ? new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Kuala_Lumpur', month: 'short', day: 'numeric' }).format(new Date(value)) : '未提供日期';
const time = (value?: string | null) => value ? new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Kuala_Lumpur', dateStyle: 'short', timeStyle: 'short', hour12: false }).format(new Date(value)) : '尚未成功检查';
const totalControls = (b: ProductBundle) => b.product.screens.reduce((n, s) => n + s.controls.length, 0);
const progress = (b: ProductBundle, viewed: string[]) => b.product.screens.flatMap(s => s.controls).filter(c => viewed.includes(`${b.product.id}/${c.id}`)).length;
function ProductMark({ id, small = false }: { id: string; small?: boolean }) { return <span className={`product-mark ${id} ${small ? 'small' : ''}`} aria-hidden="true">{id === 'claude' ? <WandSparkles /> : id === 'chatgpt' ? <Sparkles /> : <Monitor />}</span>; }
function Evidence({ value }: { value: keyof typeof evidenceText }) { return <span className={`evidence ${value}`}><span />{evidenceText[value]}</span>; }

export default function App() {
  const [route, setRoute] = useState<Route>(() => parseRoute(location.hash));
  const [learning, setLearning] = useState(readLearning);
  const [query, setQuery] = useState('');
  const [indexOpen, setIndexOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [toggleValues, setToggleValues] = useState<Record<string, boolean>>({});
  const [tour, setTour] = useState<{ productId: string; tourId: string; index: number } | null>(null);
  const tourDriver = useRef<Driver | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const bundle = catalog.find(b => b.product.id === route.productId);
  const screen = bundle?.product.screens.find(s => s.id === route.screenId) || bundle?.product.screens.find(s => s.id === bundle.product.initialScreen);
  const selected = bundle ? locateControl(bundle, route.controlId) : undefined;
  const go = (next: Route) => { setNotice(''); location.hash = routeHash(next); setQuery(''); setIndexOpen(false); setNavOpen(false); };
  const openControl = (b: ProductBundle, id: string) => { const owner = locateControl(b, id); if (owner) go({ productId: b.product.id, tab: 'guide', screenId: owner.screen.id, controlId: id }); };
  useEffect(() => { const sync = () => setRoute(parseRoute(location.hash)); addEventListener('hashchange', sync); return () => removeEventListener('hashchange', sync); }, []);
  useEffect(() => { saveLearning(learning); }, [learning]);
  useEffect(() => {
    if (!bundle || !selected) return;
    const key = `${bundle.product.id}/${selected.control.id}`;
    setLearning(prev => prev.viewed.includes(key) ? prev : { ...prev, viewed: [...prev.viewed, key] });
  }, [bundle, selected?.control.id]);
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); searchRef.current?.focus(); }
      if (event.key === 'Escape') {
        setQuery(''); setIndexOpen(false); setNavOpen(false); setTour(null);
        if (screen?.layout === 'dialog' && screen.parentId) go({ ...route, screenId: screen.parentId, controlId: undefined });
      }
    };
    addEventListener('keydown', keydown); return () => removeEventListener('keydown', keydown);
  }, [screen, route]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 6500); return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    if (!tour || !bundle || tour.productId !== bundle.product.id) return;
    const itinerary = bundle.product.tours.find(t => t.id === tour.tourId);
    const id = itinerary?.controlIds[tour.index];
    const owner = locateControl(bundle, id);
    if (!id || !owner) { setTour(null); return; }
    if (route.tab !== 'guide' || route.screenId !== owner.screen.id || route.controlId !== id) {
      go({ productId: bundle.product.id, tab: 'guide', screenId: owner.screen.id, controlId: id }); return;
    }
    const frame = requestAnimationFrame(() => {
      const element = document.querySelector(`[data-control-id="${CSS.escape(id)}"]`);
      if (!element) { setTour(null); setNotice('当前步骤的按钮未显示，请从界面清单打开。'); return; }
      const advance = (delta: number) => {
        if (tour.index + delta >= itinerary!.controlIds.length) { setTour(null); setNotice('这条操作路径已经学完，可以继续自由探索。'); }
        else setTour({ ...tour, index: Math.max(0, tour.index + delta) });
      };
      tourDriver.current = driver({ animate: false, overlayOpacity: 0.35, overlayClickBehavior: 'none', allowKeyboardControl: false, popoverClass: 'manual-tour', steps: [{ element, popover: {
        title: owner.control.label, description: `${tour.index + 1} / ${itinerary!.controlIds.length}　${owner.control.guide.purpose}`,
        showButtons: ['previous', 'next', 'close'], disableButtons: tour.index === 0 ? ['previous'] : [],
        prevBtnText: '上一步', nextBtnText: tour.index === itinerary!.controlIds.length - 1 ? '完成引导' : '下一步', closeBtnLabel: '关闭引导',
        onNextClick: () => advance(1), onPrevClick: () => advance(-1), onCloseClick: () => setTour(null),
      } }] });
      tourDriver.current.drive();
    });
    return () => { cancelAnimationFrame(frame); tourDriver.current?.destroy(); tourDriver.current = null; };
  }, [tour, route, bundle]);

  const activate = (control: Control, enteredText?: string) => {
    if (!bundle || !screen) return;
    const action = control.action;
    let target = screen.id;
    if (action.kind === 'navigate') target = action.target!;
    if (action.kind === 'back') target = action.target || screen.parentId || bundle.product.initialScreen;
    go({ productId: bundle.product.id, tab: 'guide', screenId: target, controlId: control.id });
    if (action.kind === 'toggle') setToggleValues(prev => ({ ...prev, [`${bundle.product.id}/${control.id}`]: !prev[`${bundle.product.id}/${control.id}`] }));
    if (action.kind === 'notice' || action.kind === 'submit' || action.kind === 'toggle') setNotice(`${enteredText ? '已演示发送。' : ''}${action.result || control.guide.outcome}`);
  };
  const matches = query.trim() ? catalog.flatMap(b => b.product.screens.flatMap(s => s.controls.filter(c => `${b.product.name} ${s.title} ${c.label} ${c.guide.purpose} ${(c.guide.keywords || []).join(' ')}`.toLowerCase().includes(query.trim().toLowerCase())).map(c => ({ b, s, c })))).slice(0, 35) : [];
  const reviewCount = bundle ? bundle.product.screens.flatMap(s => s.controls).filter(c => evidenceFor(bundle, c.id) === 'needs-review').length + bundle.updates.filter(u => u.interpretation === 'pending' && !u.controlIds.length).length : 0;

  return <div className="shell">
    <aside className={`site-sidebar ${navOpen ? 'open' : ''}`}>
      <a className="brand" href="#/" onClick={() => setNavOpen(false)}><span className="brand-symbol"><BookOpen size={23} /></span><span>App Manual<small>软件操作说明书</small></span></a>
      <button className={`library-link ${!route.productId ? 'active' : ''}`} onClick={() => go({ tab: 'guide' })}><BookOpen size={18} />我的说明书</button>
      <div className="sidebar-label">产品目录 <span>{catalog.length}</span></div>
      <nav aria-label="产品目录">
        {catalog.map(b => <button key={b.product.id} className={`product-link ${bundle?.product.id === b.product.id ? 'active' : ''}`} onClick={() => { setTour(null); go({ productId: b.product.id, tab: 'guide', screenId: b.product.initialScreen }); }}>
          <ProductMark id={b.product.id} small /><span>{b.product.name}<small>{b.product.plan}</small></span><ChevronRight size={15} />
        </button>)}
      </nav>
      <div className="sidebar-bottom"><span className="live-dot" />持续跟进官方更新<p>Windows 桌面版<br />中文说明 / 原版按钮名称</p><a href="#/" onClick={() => go({ tab: 'guide' })}>如何使用这本说明书 <ArrowRight size={14} /></a></div>
    </aside>
    {navOpen && <button className="nav-scrim" aria-label="关闭产品目录" onClick={() => setNavOpen(false)} />}
    <div className="main-shell">
      <header className="topbar">
        <button className="icon-button mobile-menu" aria-label="打开产品目录" onClick={() => setNavOpen(true)}><Menu size={20} /></button>
        <div className="breadcrumb"><span>说明书</span>{bundle && <><ChevronRight size={14} /><strong>{bundle.product.name}</strong></>}</div>
        <div className="global-search"><Search size={17} /><input ref={searchRef} aria-label="搜索按钮和功能" placeholder="搜索按钮、功能或操作路径" value={query} onChange={event => setQuery(event.target.value)} /><kbd>Ctrl K</kbd>
          {query && <div className="search-results" role="region" aria-label="搜索结果"><div className="search-results-label">找到 {matches.length}{matches.length === 35 ? '+' : ''} 个操作</div>{matches.map(({ b, s, c }) => <button key={`${b.product.id}/${c.id}`} onClick={() => { setTour(null); openControl(b, c.id); }}><ProductMark id={b.product.id} small /><span><strong>{c.label}</strong><small>{b.product.name} / {s.title}</small></span><ChevronRight size={15} /></button>)}{!matches.length && <p>没有找到。试试“项目”“Memory”或“设置”。</p>}</div>}
        </div>
        <span className="desktop-label"><Monitor size={15} />Windows</span>
      </header>
      <main id="main-content">
        {!bundle ? <Library learning={learning.viewed} open={b => go({ productId: b.product.id, tab: 'guide', screenId: b.product.initialScreen })} unknown={!!route.productId} /> : <>
          <section className="product-heading"><div className="heading-identity"><ProductMark id={bundle.product.id} /><div><div className="title-line"><h1>{bundle.product.name}</h1><span className="plan-tag">{bundle.product.plan}</span></div><p>{bundle.product.versionLabel}</p></div></div><div className="learning-meter"><span>已探索 <strong>{progress(bundle, learning.viewed)}</strong> / {totalControls(bundle)} 个操作</span><div><i style={{ width: `${progress(bundle, learning.viewed) / Math.max(1, totalControls(bundle)) * 100}%` }} /></div></div></section>
          <nav className="section-tabs" aria-label="说明书栏目">{tabs.map(tab => <button key={tab.id} className={route.tab === tab.id ? 'active' : ''} onClick={() => { setTour(null); go({ productId: bundle.product.id, tab: tab.id, screenId: screen?.id }); }}><tab.icon size={16} />{tab.label}{tab.id === 'review' && reviewCount > 0 && <span className="count">{reviewCount}</span>}</button>)}</nav>
          {route.tab === 'guide' && screen && <>
            <div className="guide-toolbar"><div><span className="live-dot" /><span>自由探索</span><span className="toolbar-divider" /><span className="muted">点击模拟按钮，阅读操作说明</span></div><div><button className="subtle-button" onClick={() => setIndexOpen(!indexOpen)} aria-expanded={indexOpen}><List size={16} />页面目录<ChevronDown size={14} /></button><select aria-label="选择分步引导" value="" onChange={event => { if (event.target.value) setTour({ productId: bundle.product.id, tourId: event.target.value, index: 0 }); }}><option value="">开始分步引导</option>{bundle.product.tours.map(t => <option value={t.id} key={t.id}>{t.title}</option>)}</select></div></div>
            {indexOpen && <section className="page-directory" aria-label="页面目录">{[...new Set(bundle.product.screens.map(s => s.section))].map(group => <div key={group}><h3>{group}</h3>{bundle.product.screens.filter(s => s.section === group).map(s => <button key={s.id} className={screen.id === s.id ? 'active' : ''} onClick={() => go({ productId: bundle.product.id, tab: 'guide', screenId: s.id })}>{s.title}<ChevronRight size={13} /></button>)}</div>)}</section>}
            <div className="guide-layout"><div className="simulator-column"><Simulator key={`${bundle.product.id}/${screen.id}`} bundle={bundle} screen={screen} selectedId={selected?.control.id} activate={activate} toggleValues={toggleValues} go={go} />
              <div className="simulation-note"><Info size={15} /><p>这是用于学习的模拟界面。功能与路径依据官方资料整理；按钮位置可能随版本、账户和逐步开放而不同。</p></div>
              <div className="quick-tours"><h3><Compass size={18} />试着走完一条操作路径</h3>{bundle.product.tours.slice(0, 3).map(t => <button key={t.id} onClick={() => setTour({ productId: bundle.product.id, tourId: t.id, index: 0 })}><span><strong>{t.title}</strong><small>{t.description}</small></span><span className="tour-length">{t.controlIds.length} 步 <Play size={13} /></span></button>)}</div>
            </div><GuidePanel bundle={bundle} selection={selected} go={go} /></div>
          </>}
          {route.tab === 'updates' && <Updates bundle={bundle} readIds={learning.readUpdates} markRead={id => setLearning(prev => ({ ...prev, readUpdates: prev.readUpdates.includes(id) ? prev.readUpdates.filter(v => v !== id) : [...prev.readUpdates, id] }))} openControl={id => openControl(bundle, id)} />}
          {route.tab === 'differences' && <section className="content-page"><div className="section-intro"><History size={22} /><div><h2>以前这样用，现在这样用</h2><p>入口和使用方法的变化，保留对照。</p></div></div>{bundle.product.differences.map((d, i) => <article className="difference" key={i}><h3>{d.title}</h3><div className="difference-columns"><div><span>旧版用法</span><p>{d.before}</p></div><div><span>新版用法</span><p>{d.now}</p></div></div><SourceLinks bundle={bundle} ids={d.sourceIds} /></article>)}</section>}
          {route.tab === 'review' && <Review bundle={bundle} openControl={id => openControl(bundle, id)} />}
          {route.tab === 'coverage' && <Coverage bundle={bundle} viewed={learning.viewed} openControl={id => openControl(bundle, id)} />}
        </>}
      </main>
      <footer className="site-footer"><span>App Manual <span className="footer-dot">/</span>把软件读明白</span><span>学习记录保存在此浏览器</span></footer>
    </div>
    {notice && <div className="toast" role="status"><CheckCircle2 size={19} /><span>{notice}</span><button className="icon-button" aria-label="关闭操作结果" onClick={() => setNotice('')}><X size={17} /></button></div>}
  </div>;
}

function Library({ learning, open, unknown }: { learning: string[]; open: (bundle: ProductBundle) => void; unknown: boolean }) {
  return <div className="library"><section className="library-hero"><div className="hero-copy"><span className="edition-label"><BookOpen size={17} />会持续更新的操作说明书</span><h1>把每个按钮，<br />读明白。</h1><p>打开一款软件，走进每一层页面。<br />了解最新功能，也学会新的用法。</p><a className="primary-button" href={routeHash({ productId: 'chatgpt', tab: 'guide' })}>打开 ChatGPT 手册 <ArrowRight size={17} /></a></div><div className="manual-illustration" aria-hidden="true"><div className="illustration-tab">操作手册</div><div className="mini-window"><div className="mini-window-header"><Sparkles size={18} />ChatGPT<span>Windows</span></div><div className="mini-window-body"><div className="mini-nav"><i /><i /><i /><i /></div><div className="mini-content"><span>从这里，开始探索</span><div><Paperclip size={15} /><i /><span className="highlight-demo"><Plus size={17} /></span></div></div></div></div><div className="mini-explanation"><span className="mini-info">i</span><div><strong>这个按钮是做什么的？</strong><p>用途、步骤、操作结果，<br />还有更新后的入口。</p></div></div></div></section>
    {unknown && <p role="alert" className="empty-state">这个产品尚未加入，请从下方选择已有说明书。</p>}
    <section className="library-products"><div className="section-title"><h2>选择一本说明书</h2><span>电脑 App / 个人付费版</span></div>{catalog.map(b => <button className="manual-book" key={b.product.id} onClick={() => open(b)} style={{ '--product-accent': b.product.accent } as CSSProperties}><div className="book-spine" /><ProductMark id={b.product.id} /><div className="book-summary"><h3>{b.product.name}<span>{b.product.plan}</span></h3><p>{b.product.intro}</p><div className="book-meta"><span>{b.product.screens.length} 个页面</span><span>{totalControls(b)} 个操作</span><span>已探索 {progress(b, learning)} 个</span></div></div><span className="book-open">打开手册<ArrowRight size={20} /></span></button>)}</section>
    <section className="how-to"><h2>像翻说明书一样，学会新用法</h2><div><article><span className="instruction-number">1</span><h3>点击真实操作入口</h3><p>模拟按钮会展开菜单、弹窗和下层页面，让你沿着操作路径继续探索。</p></article><article><span className="instruction-number">2</span><h3>阅读旁边的说明</h3><p>每个操作都有用途、步骤、适用条件和来源；也可以选择分步引导。</p></article><article><span className="instruction-number">3</span><h3>跟进功能变化</h3><p>官方更新自动收集。已整理的中文解读会连接到对应操作，待核验内容明确标记。</p></article></div></section>
  </div>;
}

function ControlButton({ control, selected, activate, toggled }: { control: Control; selected: boolean; activate: (c: Control) => void; toggled: boolean }) {
  const label = control.label.toLowerCase();
  const inferred = /new chat/.test(label) ? Plus : /settings|设置/.test(label) ? Settings : /recents|history/.test(label) ? History : /projects|项目/.test(label) ? Folder : /code|codex/.test(label) ? Code2 : /search/.test(label) ? Search : /scheduled/.test(label) ? Clock3 : /artifact|output/.test(label) ? FileText : /plugins|tools|customize/.test(label) ? Sparkles : control.action.kind === 'navigate' ? ChevronRight : Info;
  const Icon = icons[control.icon || ''] || inferred;
  return <button data-control-id={control.id} data-testid={`control-${control.id}`} className={`sim-control ${control.placement || 'content'} ${selected ? 'selected' : ''} ${control.action.kind === 'toggle' ? 'toggle-control' : ''}`} onClick={() => activate(control)} aria-pressed={control.action.kind === 'toggle' ? toggled : undefined} title={control.guide.purpose}><Icon size={17} /><span>{control.label}</span>{control.action.kind === 'toggle' ? <i className={`switch ${toggled ? 'on' : ''}`} /> : control.action.kind === 'navigate' ? <ChevronRight className="control-chevron" size={14} /> : <span className="control-hint">i</span>}</button>;
}

function Simulator({ bundle, screen, selectedId, activate, toggleValues, go }: { bundle: ProductBundle; screen: Screen; selectedId?: string; activate: (c: Control, text?: string) => void; toggleValues: Record<string, boolean>; go: (route: Route) => void }) {
  const [draft, setDraft] = useState('');
  const [sent, setSent] = useState('');
  const home = bundle.product.screens.find(s => s.id === bundle.product.initialScreen)!;
  const sidebar = [...screen.controls.filter(c => c.placement === 'sidebar'), ...home.controls.filter(c => c.placement === 'sidebar' && !screen.controls.some(v => v.id === c.id))];
  const controls = screen.controls.filter(c => c.placement !== 'sidebar');
  const composer = controls.filter(c => c.placement === 'composer');
  const top = controls.filter(c => c.placement === 'toolbar' || c.placement === 'tab');
  const body = controls.filter(c => !['composer', 'toolbar', 'tab'].includes(c.placement || 'content'));
  const render = (c: Control) => <ControlButton key={c.id} control={c} selected={selectedId === c.id} activate={activate} toggled={!!toggleValues[`${bundle.product.id}/${c.id}`]} />;
  const isChat = screen.layout === 'chat';
  const submitControl = composer.find(c => c.action.kind === 'submit') || body.find(c => c.action.kind === 'submit');
  const send = () => { if (!submitControl || !draft.trim()) return; setSent(draft.trim()); activate(submitControl, draft); setDraft(''); };
  return <section className={`simulator ${bundle.product.id} layout-${screen.layout}`} aria-label={`${bundle.product.name} 模拟界面`}>
    <div className="sim-titlebar"><span><ProductMark id={bundle.product.id} small />{bundle.product.name}</span><span><Monitor size={12} />Windows <i />模拟界面</span></div>
    <div className="sim-window-body"><aside className="sim-sidebar"><div className="sim-sidebar-heading"><ProductMark id={bundle.product.id} small /><strong>{bundle.product.name}</strong></div><div className="sim-sidebar-controls">{sidebar.map(render)}</div><div className="sim-demo-project"><span>演示内容</span><p><MessageCircle size={13} />我的学习计划</p><p><Folder size={13} />产品研究</p></div><div className="sim-account"><span>Y</span><div>学习账户<small>{bundle.product.plan}</small></div></div></aside>
      <div className="sim-main"><div className="sim-toolbar"><div>{screen.parentId && <button aria-label="返回上一层界面" className="sim-back" onClick={() => go({ productId: bundle.product.id, tab: 'guide', screenId: screen.parentId })}><ArrowLeft size={16} /></button>}<span>{screen.section}</span></div><span className="sim-platform-tag">{bundle.product.plan}</span></div>
        {top.length > 0 && <div className="sim-top-controls">{top.map(render)}</div>}
        <div className="sim-screen-content"><div className="screen-heading">{isChat && <ProductMark id={bundle.product.id} />}<h2>{screen.title}</h2><p>{screen.description}</p></div>
          {sent && <div className="demo-conversation"><div className="demo-user">{sent}</div><div className="demo-response"><ProductMark id={bundle.product.id} small /><p>这里展示模拟回复。你可以继续探索工具、项目和设置，真实操作请回到 {bundle.product.name}。</p></div></div>}
          {screen.layout === 'dialog' && <div className="dialog-caption"><Info size={14} />弹窗演示 · 按 Esc 返回</div>}
          <div className={`sim-content-controls ${screen.layout}`}>{body.map(render)}</div>
          {isChat && <div className="sim-composer"><textarea aria-label="模拟消息" value={draft} onChange={e => setDraft(e.target.value)} placeholder={`给 ${bundle.product.name} 发一条演示消息…`} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }} /><div className="sim-composer-actions">{composer.map(c => c.action.kind === 'submit' ? <button key={c.id} data-control-id={c.id} data-testid={`control-${c.id}`} className={`sim-send ${selectedId === c.id ? 'selected' : ''}`} aria-label={c.label} onClick={() => { if (draft.trim()) send(); else activate(c); }}><ArrowUp size={17} /></button> : render(c))}</div></div>}
          {!isChat && composer.length > 0 && <div className="sim-composer-actions standalone">{composer.map(render)}</div>}
        </div><div className="sim-screen-footer">{screen.title}<span>点击按钮查看操作说明</span></div>
      </div>
    </div>
  </section>;
}

function SourceLinks({ bundle, ids }: { bundle: ProductBundle; ids: string[] }) { return <div className="source-links">{ids.map(id => { const source = bundle.sources.find(s => s.id === id); return source ? <a key={id} href={source.url} target="_blank" rel="noopener noreferrer">{source.title}<ExternalLink size={12} /></a> : null; })}</div>; }
function GuidePanel({ bundle, selection, go }: { bundle: ProductBundle; selection: ReturnType<typeof locateControl>; go: (route: Route) => void }) {
  if (!selection) return <aside className="guide-panel empty"><div className="panel-label"><BookOpen size={17} />操作说明</div><div className="empty-guide-illustration"><CircleHelp size={36} /><span /></div><h2>想了解哪个按钮？</h2><p>点击左边模拟界面的任意按钮。这里会告诉你它的用途、操作步骤，以及进入下一层后怎么用。</p><div className="panel-tip"><Info size={17} /><span>也可以搜索按钮名称，或选择一条分步引导。</span></div><div className="evidence-key"><h3>说明的核验状态</h3><Evidence value="documented" /><p>根据官方资料整理，界面位置仍可能不同。</p><Evidence value="ui-verified" /><p>已在指定版本的真实界面检查。</p><Evidence value="needs-review" /><p>资料有变化或界面细节尚未确认。</p></div></aside>;
  const { control, screen } = selection;
  return <aside className="guide-panel" aria-label="操作说明"><div className="panel-label"><BookOpen size={17} />操作说明<span className="read-indicator"><Check size={13} />已探索</span></div><div className="guide-control-name"><h2>{control.label}</h2><p>{screen.section} / {screen.title}</p></div><Evidence value={evidenceFor(bundle, control.id)} /><div className="guide-purpose">{control.guide.purpose}</div><h3>怎样使用</h3><ol className="guide-steps">{control.guide.steps.map((step, i) => <li key={i}><span>{i + 1}</span><p>{step}</p></li>)}</ol><div className="guide-outcome"><CheckCircle2 size={16} /><div><h3>操作后会发生什么</h3><p>{control.guide.outcome}</p></div></div><h3>适用条件</h3><p className="guide-text">{control.guide.conditions}</p><h3>找不到或无法使用？</h3><p className="guide-text">{control.guide.troubleshooting}</p><div className="guide-evidence"><h3>来源与核验</h3><p>{bundle.product.platform} / {bundle.product.plan}</p><p>{bundle.product.versionLabel}</p><p>资料核对：{control.guide.verifiedAt}</p><SourceLinks bundle={bundle} ids={control.guide.sourceIds} /></div><button className="subtle-button panel-owner-link" onClick={() => go({ productId: bundle.product.id, tab: 'guide', screenId: screen.id, controlId: control.id })}>打开此按钮所在页面<ArrowRight size={15} /></button></aside>;
}

function TrackingStatus({ bundle }: { bundle: ProductBundle }) {
  const values = Object.values(bundle.tracking.sources);
  const successes = values.map(v => v.lastSuccessAt).filter(Boolean).sort();
  const failed = values.filter(v => v.status === 'error').length;
  const completed = values.filter(v => v.status === 'ok').length;
  return <section className={`tracking-status ${failed ? 'has-error' : ''}`}><Clock3 size={19} /><div><strong>{successes.length ? `最近来源检查：${time(successes.at(-1))}` : '自动检查尚未建立首次成功记录'}</strong><p>马来西亚时间 09:17、21:17 检查官方来源 · {completed}/{bundle.sources.length} 个来源成功{failed ? ` · ${failed} 个失败，保留已有数据` : ''}</p></div><details><summary>查看来源状态</summary><div className="source-statuses">{bundle.sources.map(source => { const state = bundle.tracking.sources[source.id]; return <div key={source.id}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}<ExternalLink size={12} /></a><span>{state?.status === 'ok' ? '成功' : state?.status === 'error' ? '失败' : '未运行'}</span><small>上次成功：{time(state?.lastSuccessAt)}</small>{state?.error && <small className="error-text">{state.error}</small>}</div>; })}</div></details></section>;
}
function Updates({ bundle, readIds, markRead, openControl }: { bundle: ProductBundle; readIds: string[]; markRead: (id: string) => void; openControl: (id: string) => void }) {
  const [filter, setFilter] = useState('all');
  const updates = [...bundle.updates].sort((a, b) => (b.publishedAt || b.detectedAt).localeCompare(a.publishedAt || a.detectedAt)).filter(u => filter === 'all' || (filter === 'pending' ? u.interpretation === 'pending' : !readIds.includes(`${bundle.product.id}/${u.id}`)));
  return <section className="content-page"><div className="section-intro"><Newspaper size={22} /><div><h2>最新变化，连接到新的用法</h2><p>收集官方功能更新；中文解读核验后补充。</p></div></div><TrackingStatus bundle={bundle} /><div className="list-filters">{[['all', '全部更新'], ['unread', '未读'], ['pending', '待整理']].map(([value, label]) => <button className={filter === value ? 'active' : ''} key={value} onClick={() => setFilter(value)}>{label}</button>)}<span>{updates.length} 条</span></div><div className="updates-list">{updates.map(u => <article className={`update-item ${readIds.includes(`${bundle.product.id}/${u.id}`) ? 'is-read' : ''}`} key={u.id}><div className="update-date">{date(u.publishedAt || u.detectedAt)}<small>{u.publishedAt ? '发布日期' : '发现日期'}</small></div><div className="update-content"><div className="update-tags"><span>{u.type === 'baseline' ? '初始收录' : u.type === 'documentation' ? '文档变化' : u.type === 'edited' ? '内容修订' : '新增更新'}</span>{u.interpretation === 'pending' && <span className="pending-tag">中文解读待整理</span>}</div><h3><a href={u.url} target="_blank" rel="noopener noreferrer">{u.title}<ExternalLink size={14} /></a></h3>{u.summaryZh && <p>{u.summaryZh}</p>}<div className="related-controls">{u.controlIds.map(id => { const owner = locateControl(bundle, id); return owner && <button key={id} onClick={() => openControl(id)}><BookOpen size={13} />{owner.control.label}<ChevronRight size={12} /></button>; })}</div><div className="update-meta"><span>{bundle.sources.find(s => s.id === u.sourceId)?.title || '官方来源'}</span><span>发现于 {time(u.detectedAt)}</span><button onClick={() => markRead(`${bundle.product.id}/${u.id}`)}>{readIds.includes(`${bundle.product.id}/${u.id}`) ? <><Check size={13} />已读</> : '标为已读'}</button></div></div></article>)}</div>{!updates.length && <div className="empty-state"><CheckCircle2 size={25} /><p>这里暂时没有符合条件的更新。</p></div>}</section>;
}
function Review({ bundle, openControl }: { bundle: ProductBundle; openControl: (id: string) => void }) {
  const pending = bundle.updates.filter(u => u.interpretation === 'pending');
  const controls = bundle.product.screens.flatMap(s => s.controls.map(c => ({ s, c }))).filter(({ c }) => evidenceFor(bundle, c.id) === 'needs-review');
  const [copied, setCopied] = useState(false);
  const prompt = `更新 ${bundle.product.name} 手册：读取 products/${bundle.product.id}/ 的官方来源、updates.json、tracking.json 和 product.json，核验待整理新闻与受影响操作；修订中文说明和新旧差异，保留来源、平台、套餐与核验日期，完成验证后部署。只有已核验的内容才清除待核验标记。`;
  return <section className="content-page"><div className="section-intro"><ClipboardList size={22} /><div><h2>让说明书跟上软件</h2><p>更新被发现后，界面说明需要进一步核验。</p></div></div><div className="maintenance-callout"><BookOpen size={24} /><div><h3>在 Codex 发起一次手册更新</h3><p>自动检查负责发现变化。将下方指令发给 Codex，核验并修订中文手册。</p><textarea aria-label="手册更新指令" readOnly value={prompt} /><button className="primary-button" onClick={async () => { try { await navigator.clipboard.writeText(prompt); setCopied(true); } catch { setCopied(false); } }}>{copied ? <><Check size={15} />已复制</> : '复制更新指令'}</button></div></div><h3 className="list-heading">待整理新闻 <span>{pending.length}</span></h3>{pending.length ? pending.map(u => <div className="review-row" key={u.id}><Newspaper size={18} /><a href={u.url} target="_blank" rel="noopener noreferrer">{u.title}<ExternalLink size={13} /></a><span>待整理</span></div>) : <p className="inline-empty">目前没有待整理的新闻。</p>}<h3 className="list-heading">待核验操作 <span>{controls.length}</span></h3>{controls.length ? controls.map(({ s, c }) => <button className="review-row" key={c.id} onClick={() => openControl(c.id)}><CircleHelp size={18} /><span><strong>{c.label}</strong><small>{s.title}</small></span><ChevronRight size={15} /></button>) : <p className="inline-empty">目前没有额外标记待核验的操作。文档支持的操作仍不等于真实界面已核验。</p>}<TrackingStatus bundle={bundle} /></section>;
}
function Coverage({ bundle, viewed, openControl }: { bundle: ProductBundle; viewed: string[]; openControl: (id: string) => void }) {
  const [filter, setFilter] = useState('');
  return <section className="content-page"><div className="section-intro"><Layers size={22} /><div><h2>每一层，都有说明</h2><p>{bundle.product.screens.length} 个页面，{totalControls(bundle)} 个操作。此清单展示已纳入的界面，仍需根据真实版本继续核验。</p></div></div><label className="coverage-search"><Search size={16} /><input aria-label="筛选界面清单" placeholder="筛选页面或按钮名称" value={filter} onChange={e => setFilter(e.target.value)} /></label><div className="coverage-list">{bundle.product.screens.map(s => { const controls = s.controls.filter(c => `${s.title} ${c.label}`.toLowerCase().includes(filter.toLowerCase())); return controls.length ? <details key={s.id} open={!!filter || undefined}><summary><span><strong>{s.title}</strong><small>{s.section}</small></span><span>{controls.length} 个操作<ChevronDown size={15} /></span></summary><div>{controls.map(c => <button key={c.id} onClick={() => openControl(c.id)}><span>{viewed.includes(`${bundle.product.id}/${c.id}`) ? <CheckCircle2 size={15} /> : <span className="unread-ring" />}{c.label}</span><Evidence value={evidenceFor(bundle, c.id)} /><ChevronRight size={14} /></button>)}</div></details> : null; })}</div></section>;
}
