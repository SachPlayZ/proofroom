import { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  CircleHelp,
  Copy,
  Eye,
  Fingerprint,
  FileCheck2,
  FileLock2,
  KeyRound,
  Landmark,
  LockKeyhole,
  Plus,
  Radio,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  TimerReset,
  UserRound,
  UsersRound,
  WalletCards,
  X,
} from 'lucide-react';
import {
  buyerFundsFixture,
  demoDossier,
  formatMoney,
  initialCriteria,
  initialListing,
  initialRequest,
  sellerFixture,
  shortHash,
  type MatchRequest,
  type ProofEvent,
  type ProofState,
  type Role,
} from './domain';
import { decryptDossier, encryptDossier, sha256Hex } from './crypto';
import { bankAttestation, sellerAttestation, verifyBankAttestation, verifySellerAttestation } from './mockAttesters';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const initialEvents: ProofEvent[] = [
  {
    id: 'e1',
    title: 'Listing committed',
    detail: 'PR-8F29 · seller identity stays local',
    timestamp: '08:41:12',
    kind: 'public',
  },
  {
    id: 'e2',
    title: 'Buyer criteria posted',
    detail: '4 constraints · request REQ-042',
    timestamp: '08:44:05',
    kind: 'public',
  },
];

function StatusDot({ state }: { state: ProofState }) {
  const label = state === 'verified' ? 'Verified' : state === 'proving' ? 'Proving' : state === 'failed' ? 'Failed' : 'Private';
  return (
    <span className={`status status-${state}`}>
      <span className="status-dot" />
      {label}
    </span>
  );
}

function ProofRow({
  icon,
  label,
  detail,
  state,
}: {
  icon: React.ReactNode;
  label: string;
  detail: string;
  state: ProofState;
}) {
  return (
    <div className="proof-row">
      <div className="proof-icon">{icon}</div>
      <div className="proof-copy">
        <strong>{label}</strong>
        <span>{detail}</span>
      </div>
      <StatusDot state={state} />
    </div>
  );
}

function PrivacyBadge({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
  return <span className={`privacy-badge ${accent ? 'privacy-badge-accent' : ''}`}><LockKeyhole size={12} />{children}</span>;
}

function App() {
  const [role, setRole] = useState<Role>('seller');
  const [listing, setListing] = useState(initialListing);
  const [request, setRequest] = useState<MatchRequest>(initialRequest);
  const [events, setEvents] = useState<ProofEvent[]>(initialEvents);
  const [toast, setToast] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [encryptedDossier, setEncryptedDossier] = useState<string>();
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey>();
  const [decryptedDossier, setDecryptedDossier] = useState<typeof demoDossier>();
  const [newAskFloor, setNewAskFloor] = useState('1200000');

  const bothVerified = request.sellerProof === 'verified' && request.buyerProof === 'verified';
  const publicState = useMemo(() => [
    ['Seller qualification', request.sellerProof === 'verified' ? 'PASS / 4 constraints' : 'PENDING'],
    ['Buyer funds', request.buyerProof === 'verified' ? 'PASS / ≥ asking floor' : 'PENDING'],
    ['Dossier access', request.accessGranted ? 'GRANTED / encrypted' : 'LOCKED'],
  ], [request]);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(''), 3600);
  }

  function addEvent(event: Omit<ProofEvent, 'id' | 'timestamp'>) {
    setEvents((current) => [{ ...event, id: crypto.randomUUID(), timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }, ...current]);
  }

  async function proveSeller() {
    if (request.sellerProof === 'verified') return;
    setRequest((current) => ({ ...current, sellerProof: 'proving' }));
    notify('Generating a local proof from the private Stripe attestation…');
    await wait(1100);
    const attestation = sellerAttestation(sellerFixture);
    const passed = verifySellerAttestation(attestation, request.criteria);
    setRequest((current) => ({ ...current, sellerProof: passed ? 'verified' : 'failed' }));
    if (passed) {
      addEvent({ title: 'Seller fit proven', detail: '4/4 metrics · raw values withheld', kind: 'proof' });
      notify('Seller qualified. No revenue or customer data left the device.');
    }
  }

  async function proveBuyer() {
    if (request.buyerProof === 'verified') return;
    setRequest((current) => ({ ...current, buyerProof: 'proving' }));
    notify('Checking a private bank attestation locally…');
    await wait(1000);
    const attestation = bankAttestation(buyerFundsFixture);
    const passed = verifyBankAttestation(attestation, listing.askFloor);
    setRequest((current) => ({ ...current, buyerProof: passed ? 'verified' : 'failed' }));
    if (passed) {
      addEvent({ title: 'Funds threshold proven', detail: 'Available funds ≥ asking floor · exact balance withheld', kind: 'proof' });
      notify('Buyer qualified. Exact balance remains private.');
    }
  }

  async function grantAccess() {
    if (!bothVerified || request.accessGranted) return;
    const encrypted = await encryptDossier(demoDossier);
    setEncryptedDossier(encrypted.ciphertext);
    setEncryptionKey(encrypted.key);
    setListing((current) => ({ ...current, dossierHash: encrypted.hash }));
    setRequest((current) => ({ ...current, accessGranted: true, ciphertextHash: encrypted.hash }));
    addEvent({ title: 'Dossier access granted', detail: `${encrypted.hash} · encrypted off-chain payload`, kind: 'access' });
    notify('Access receipt written. The data room is still encrypted.');
  }

  async function unlockDossier() {
    if (!encryptedDossier || !encryptionKey) return;
    setIsUnlocking(true);
    await wait(700);
    const dossier = await decryptDossier(encryptedDossier, encryptionKey) as typeof demoDossier;
    setDecryptedDossier(dossier);
    setIsUnlocking(false);
    addEvent({ title: 'Dossier opened by buyer', detail: 'Decrypted locally after mutual qualification', kind: 'access' });
    notify('Private dossier decrypted locally.');
  }

  async function createListing() {
    setIsCreating(true);
    await wait(500);
    const hash = await sha256Hex(`${newAskFloor}:${Date.now()}`);
    setListing({
      id: `PR-${hash.slice(0, 4).toUpperCase()}`,
      alias: 'New anonymous SaaS listing',
      category: 'B2B SaaS · anonymous listing',
      askFloor: Number(newAskFloor) || 1200000,
      sellerCommitment: `mn_commit_${hash.slice(4, 8)}…${hash.slice(-4)}`,
      dossierHash: `sha256:${hash.slice(0, 8)}…`,
      active: true,
    });
    setRequest({ ...initialRequest, listingId: `PR-${hash.slice(0, 4).toUpperCase()}` });
    setEncryptedDossier(undefined);
    setEncryptionKey(undefined);
    setDecryptedDossier(undefined);
    setIsCreating(false);
    addEvent({ title: 'New listing committed', detail: 'Seller commitment and dossier hash are public', kind: 'public' });
    notify('Anonymous listing committed to the demo ledger.');
  }

  function renderAction() {
    if (role === 'seller') {
      return (
        <>
          <div className="action-heading">
            <div>
              <span className="eyebrow">SELLER CONSOLE</span>
              <h2>Prove the shape of the business.</h2>
            </div>
            <PrivacyBadge accent>Private by default</PrivacyBadge>
          </div>
          <p className="action-copy">Your attested metrics are evaluated on this device. ProofRoom publishes only the result buyers need to screen a deal.</p>
          <div className="metric-grid">
            <div><span>TTM revenue</span><strong>$2.4m</strong><small><LockKeyhole size={11} /> hidden in proof</small></div>
            <div><span>Net retention</span><strong>118%</strong><small><LockKeyhole size={11} /> hidden in proof</small></div>
            <div><span>Top customer</span><strong>14%</strong><small><LockKeyhole size={11} /> hidden in proof</small></div>
            <div><span>Refund rate</span><strong>2.1%</strong><small><LockKeyhole size={11} /> hidden in proof</small></div>
          </div>
          <div className="attestation-line">
            <div className="attestation-mark"><BadgeCheck size={17} /></div>
            <div><strong>Stripe fixture attestation</strong><span>Signed · expires in 6 days · {shortHash(sellerAttestation(sellerFixture).signature)}</span></div>
            <span className="verified-label">READY</span>
          </div>
          <button className="primary-button" onClick={proveSeller} disabled={request.sellerProof === 'proving' || request.sellerProof === 'verified'}>
            {request.sellerProof === 'proving' ? <><span className="spinner" /> Proving locally…</> : request.sellerProof === 'verified' ? <><Check size={17} /> Seller fit verified</> : <><Fingerprint size={17} /> Prove seller fit</>}
            {request.sellerProof !== 'proving' && request.sellerProof !== 'verified' && <ArrowUpRight size={17} />}
          </button>
          <div className="button-note"><Radio size={12} /> No private metric is sent to the indexer</div>
        </>
      );
    }

    if (role === 'buyer') {
      return (
        <>
          <div className="action-heading">
            <div>
              <span className="eyebrow">BUYER CONSOLE</span>
              <h2>Screen the deal without a data room.</h2>
            </div>
            <PrivacyBadge>Anonymous request</PrivacyBadge>
          </div>
          <p className="action-copy">Publish a screening policy, then prove the two facts that unlock a serious conversation. Your balance and identity stay behind your wallet.</p>
          <div className="criteria-card">
            <div className="criteria-header"><span>REQUEST REQ-042</span><span className="criteria-lock"><LockKeyhole size={12} /> public policy</span></div>
            <div className="criteria-row"><span>TTM revenue</span><strong>≥ {formatMoney(initialCriteria.ttmRevenue)}</strong></div>
            <div className="criteria-row"><span>Net retention</span><strong>≥ {initialCriteria.netRetention}%</strong></div>
            <div className="criteria-row"><span>Customer concentration</span><strong>≤ {initialCriteria.customerConcentration}%</strong></div>
            <div className="criteria-row"><span>Refund rate</span><strong>≤ {initialCriteria.refundRate}%</strong></div>
          </div>
          <div className="attestation-line buyer-attestation">
            <div className="attestation-mark"><Banknote size={17} /></div>
            <div><strong>Bank fixture attestation</strong><span>Available funds are evaluated privately</span></div>
            <span className="verified-label">READY</span>
          </div>
          <button className="primary-button" onClick={proveBuyer} disabled={request.buyerProof === 'proving' || request.buyerProof === 'verified'}>
            {request.buyerProof === 'proving' ? <><span className="spinner" /> Proving locally…</> : request.buyerProof === 'verified' ? <><Check size={17} /> Funds threshold verified</> : <><WalletCards size={17} /> Prove funds threshold</>}
            {request.buyerProof !== 'proving' && request.buyerProof !== 'verified' && <ArrowUpRight size={17} />}
          </button>
          <div className="button-note"><Radio size={12} /> Exact balance never becomes public state</div>
        </>
      );
    }

    return (
      <>
        <div className="action-heading">
          <div>
            <span className="eyebrow">PUBLIC VERIFIER</span>
            <h2>See what the chain can prove.</h2>
          </div>
          <PrivacyBadge accent>Selective disclosure</PrivacyBadge>
        </div>
        <p className="action-copy">The verifier view is deliberately boring: public commitments, proof outcomes, and a clean boundary around everything the parties kept private.</p>
        <div className="verifier-grid">
          <div className="verifier-stat"><span>Public facts</span><strong>08</strong><small>commitments · outcomes · hashes</small></div>
          <div className="verifier-stat"><span>Private facts</span><strong>14</strong><small>never entered the ledger</small></div>
          <div className="verifier-stat"><span>Replay attempts</span><strong>00</strong><small>nullifier protected</small></div>
        </div>
        <div className="privacy-callout"><ShieldCheck size={20} /><div><strong>Privacy boundary intact</strong><span>Public state reveals qualification, not qualification inputs.</span></div><Check size={17} /></div>
        <button className="secondary-button" onClick={() => notify('Receipt copied — a real verifier would share this proof URL.')}><Copy size={16} /> Copy public receipt <ArrowUpRight size={16} /></button>
      </>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup"><div className="brand-symbol"><span /></div><div><strong>proofroom</strong><small>private deal screening</small></div></div>
        <div className="network-pill"><span className="network-dot" /> MIDNIGHT <span>LOCAL DEMO</span></div>
        <nav className="side-nav">
          <div className="nav-label">WORKSPACE</div>
          <button className="nav-item active"><ScanSearch size={17} /> Deal room <span className="nav-count">01</span></button>
          <button className="nav-item"><FileCheck2 size={17} /> Proof receipts <span className="nav-count">03</span></button>
          <button className="nav-item"><Landmark size={17} /> Public ledger</button>
          <div className="nav-label nav-label-spaced">RESOURCES</div>
          <button className="nav-item"><CircleHelp size={17} /> How privacy works <ArrowUpRight size={14} className="nav-arrow" /></button>
          <button className="nav-item"><Sparkles size={17} /> Build on Midnight <ArrowUpRight size={14} className="nav-arrow" /></button>
        </nav>
        <div className="side-bottom">
          <div className="security-note"><ShieldCheck size={17} /><div><strong>Local proving</strong><span>Proof server connected</span></div><span className="online-dot" /></div>
          <div className="wallet-mini"><div className="wallet-avatar"><UserRound size={16} /></div><div><strong>demo wallet</strong><span>mn_addr_preprod…</span></div><ChevronRight size={16} /></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar"><div className="breadcrumbs"><span>WORKSPACE</span><ChevronRight size={13} /><strong>DEAL ROOM</strong></div><div className="top-actions"><span className="live-indicator"><span /> local ledger demo</span><button className="icon-button" aria-label="Open notifications"><TimerReset size={17} /></button><button className="avatar-button">DR</button></div></header>
        <div className="content-wrap">
          <section className="hero"><div><div className="eyebrow hero-eyebrow"><span className="eyebrow-line" /> PRIVATE M&A / MIDNIGHT</div><h1>Screen a deal<br /><em>without opening</em> the room.</h1><p>ProofRoom lets buyers and sellers prove the facts that matter, while sensitive numbers stay on their own devices.</p></div><div className="hero-side"><div className="hero-side-label">THE PRIVACY PROMISE</div><div className="hero-side-quote">“I can prove it.<br /><span>You don’t get to see it.”</span></div><div className="hero-side-foot"><LockKeyhole size={14} /> selective disclosure by design</div></div></section>

          <section className="role-strip"><div className="role-intro"><span className="eyebrow">VIEW AS</span><span>Move through the deal lifecycle</span></div><div className="role-tabs">{([['seller', BriefcaseBusiness, 'Seller'], ['buyer', UsersRound, 'Buyer'], ['auditor', Eye, 'Public verifier']] as const).map(([value, Icon, label]) => <button key={value} className={role === value ? 'role-tab selected' : 'role-tab'} onClick={() => setRole(value)}><Icon size={16} /> {label}</button>)}</div><div className="role-state"><span className="state-ring" /> demo mode</div></section>

          <section className="deal-layout">
            <div className="primary-column">
              <div className="listing-card"><div className="listing-top"><div className="listing-icon"><BriefcaseBusiness size={20} /></div><div className="listing-title"><span className="eyebrow">ANONYMOUS LISTING · {listing.id}</span><h2>{listing.alias}</h2><span>{listing.category}</span></div><div className="listing-ask"><span>ASKING FLOOR</span><strong>{formatMoney(listing.askFloor)}</strong><small>USD · seller-set</small></div></div><div className="listing-bottom"><div className="listing-chip"><Fingerprint size={14} /> seller commitment <span>{shortHash(listing.sellerCommitment)}</span></div><div className="listing-chip"><FileLock2 size={14} /> dossier hash <span>{shortHash(listing.dossierHash)}</span></div><span className="listing-active"><span /> accepting screens</span></div></div>
              <div className="console-card">{renderAction()}</div>

              {role === 'seller' && bothVerified && !request.accessGranted && <div className="unlock-card"><div className="unlock-icon"><KeyRound size={20} /></div><div><span className="eyebrow">MUTUAL QUALIFICATION COMPLETE</span><h3>Open the encrypted data room?</h3><p>Both sides passed their private checks. Publish an access receipt and release the encrypted dossier to this buyer.</p></div><button className="primary-button compact" onClick={grantAccess}><FileLock2 size={16} /> Grant access <ArrowUpRight size={16} /></button></div>}
              {role === 'buyer' && request.accessGranted && !decryptedDossier && <div className="unlock-card buyer-unlock"><div className="unlock-icon"><KeyRound size={20} /></div><div><span className="eyebrow">ACCESS RECEIPT VERIFIED</span><h3>Your private room is ready.</h3><p>The dossier hash matches the seller’s receipt. Decrypt it locally when you’re ready.</p></div><button className="primary-button compact" onClick={unlockDossier} disabled={isUnlocking}>{isUnlocking ? <><span className="spinner" /> Decrypting…</> : <><KeyRound size={16} /> Unlock locally <ArrowUpRight size={16} /></>}</button></div>}
              {role === 'buyer' && decryptedDossier && <div className="dossier-card"><div className="dossier-head"><div><span className="eyebrow">DECRYPTED DATA ROOM</span><h3>{decryptedDossier.company}</h3></div><span className="dossier-private"><LockKeyhole size={12} /> local only</span></div><div className="dossier-grid"><div><span>Domain</span><strong>{decryptedDossier.url}</strong></div><div><span>TTM revenue</span><strong>{decryptedDossier.ttmRevenue}</strong></div><div><span>Net retention</span><strong>{decryptedDossier.netRetention}</strong></div><div><span>Concentration</span><strong>{decryptedDossier.customers}</strong></div></div><div className="dossier-note"><ShieldCheck size={15} /> {decryptedDossier.note}</div></div>}
            </div>

            <aside className="right-rail">
              <div className="rail-card protocol-card"><div className="rail-heading"><div><span className="eyebrow">PROTOCOL RECEIPT</span><h3>What the chain knows</h3></div><span className="receipt-status"><span /> local</span></div><div className="state-list">{publicState.map(([label, value]) => <div className="state-row" key={label}><span>{label}</span><strong className={value.startsWith('PASS') || value.startsWith('GRANTED') ? 'state-pass' : ''}>{value}</strong></div>)}</div><div className="rail-divider" /><div className="ledger-meta"><div><span>NETWORK</span><strong>Midnight local demo</strong></div><div><span>CONTRACT</span><strong>compact/proofroom.compact</strong></div></div><button className="text-button" onClick={() => setRole('auditor')}>Inspect public receipt <ArrowUpRight size={15} /></button></div>
              <div className="rail-card boundary-card"><div className="boundary-art"><div className="boundary-orbit orbit-a" /><div className="boundary-orbit orbit-b" /><div className="boundary-core"><LockKeyhole size={20} /></div></div><span className="eyebrow">PRIVACY BOUNDARY</span><h3>Proof, not exposure.</h3><p>Compact circuits evaluate private witnesses locally. The ledger stores only the result and the minimum audit trail.</p><div className="boundary-tags"><PrivacyBadge>private inputs</PrivacyBadge><PrivacyBadge>public outcome</PrivacyBadge></div></div>
              <div className="rail-card create-card"><div className="rail-heading"><div><span className="eyebrow">SELL SOMETHING</span><h3>Start another listing</h3></div><Plus size={17} /></div><label>Asking floor <div className="money-input"><span>$</span><input value={newAskFloor} onChange={(event) => setNewAskFloor(event.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" /><span>USD</span></div></label><button className="secondary-button" onClick={createListing} disabled={isCreating}>{isCreating ? <><span className="spinner dark" /> Committing…</> : <><Plus size={15} /> Commit anonymous listing</>}</button></div>
            </aside>
          </section>

          <section className="activity-section"><div className="section-heading"><div><span className="eyebrow">CHAIN ACTIVITY</span><h2>Public timeline</h2></div><div className="activity-filter"><span className="active-filter">All events</span><span>Private state hidden</span></div></div><div className="activity-table"><div className="activity-table-head"><span>EVENT</span><span>DETAIL</span><span>TIME</span><span>TYPE</span></div>{events.slice(0, 5).map((event) => <div className="activity-row" key={event.id}><div className="event-name"><span className={`event-icon event-${event.kind}`}>{event.kind === 'proof' ? <BadgeCheck size={14} /> : event.kind === 'access' ? <KeyRound size={14} /> : <Landmark size={14} />}</span><strong>{event.title}</strong></div><span className="event-detail">{event.detail}</span><span className="event-time">{event.timestamp}</span><span className={`event-type type-${event.kind}`}>{event.kind === 'proof' ? 'ZK PROOF' : event.kind.toUpperCase()}</span></div>)}</div></section>
          <footer><span>ProofRoom is a prototype for private pre-diligence screening.</span><span><ShieldCheck size={13} /> Built around Midnight’s Compact privacy model</span></footer>
        </div>
      </main>
      {toast && <div className="toast"><span className="toast-check"><Check size={14} /></span>{toast}<button onClick={() => setToast('')} aria-label="Dismiss"><X size={14} /></button></div>}
    </div>
  );
}

export default App;
