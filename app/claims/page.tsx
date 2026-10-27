import type { Metadata } from 'next';
import Link from 'next/link';
import { ago, batches, claims, decide, fmtDateTime, rs, type Claim } from '@/lib/sample';

export const metadata: Metadata = { title: 'Quality claims' };

const FILTERS: { key: string; label: string; match: (c: Claim) => boolean }[] = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'review', label: 'Needs review', match: (c) => c.decision === 'In review' },
  { key: 'auto', label: 'Resolved instantly', match: (c) => c.decision === 'Replaced' || c.decision === 'Refunded' },
  { key: 'photo', label: 'With photo', match: (c) => c.photo },
];

const decisionBadge = (d: Claim['decision']) =>
  d === 'Replaced' ? 'ok' : d === 'Refunded' ? 'accent' : d === 'In review' ? 'warn' : 'bad';

export default async function Claims({ searchParams }: PageProps<'/claims'>) {
  const sp = await searchParams;
  const filterKey = typeof sp.filter === 'string' ? sp.filter : 'all';
  const filter = FILTERS.find((f) => f.key === filterKey) ?? FILTERS[0];
  const selectedId = typeof sp.id === 'string' ? sp.id : undefined;
  const rows = claims.filter(filter.match);
  const selected = selectedId ? claims.find((c) => c.id === selectedId) : undefined;
  const batch = selected ? batches.find((b) => b.id === selected.batchId) : undefined;
  const rule = selected ? decide(selected) : undefined;
  const href = (patch: { filter?: string; id?: string | null }) => {
    const p = new URLSearchParams();
    const f = patch.filter ?? filterKey;
    if (f !== 'all') p.set('filter', f);
    const id = patch.id === undefined ? selectedId : patch.id;
    if (id) p.set('id', id);
    return `/claims${p.size ? `?${p}` : ''}`;
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Quality claims</h1>
          <p>Every “not fresh” report after delivery, the photo check, and what was decided.</p>
        </div>
        <span className="sample-note">Sample data</span>
      </div>

      <nav className="filters" aria-label="Filter claims">
        {FILTERS.map((f) => (
          <Link key={f.key} href={href({ filter: f.key, id: null })} aria-current={f.key === filter.key ? 'true' : undefined}>
            {f.label} <b>{claims.filter(f.match).length}</b>
          </Link>
        ))}
      </nav>

      <div className={selected ? 'with-detail' : undefined}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Claim</th>
                <th>Item</th>
                <th>Reason</th>
                <th>Photo check</th>
                <th>Decision</th>
                <th className="num">Value</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className={c.id === selectedId ? 'is-selected' : undefined}>
                  <td>
                    <Link className="row-link" href={href({ id: c.id })} scroll={false}>
                      {c.customer}
                    </Link>
                    <span className="sub">
                      {c.id} · {ago(c.at)}
                    </span>
                  </td>
                  <td>
                    {c.product}
                    <span className="sub">{c.batchId}</span>
                  </td>
                  <td>{c.reason}</td>
                  <td>
                    {c.ai ? (
                      <>
                        {c.ai.match ? c.ai.issue : <span className="badge warn">Item mismatch</span>}
                        <span className="sub">{Math.round(c.ai.confidence * 100)}% sure</span>
                      </>
                    ) : (
                      <span className="muted">No photo</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${decisionBadge(c.decision)}`}>{c.decision}</span>
                    <span className="sub">{c.minutesToResolve === null ? 'Waiting for an agent' : `in ${c.minutesToResolve} min`}</span>
                  </td>
                  <td className="num">{rs(c.valueRs)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selected && batch && rule && (
          <aside className="detail" aria-label="Claim detail">
            <div className="detail-head">
              <h2>{selected.id}</h2>
              <Link className="btn" href={href({ id: null })} scroll={false}>
                Close
              </Link>
            </div>
            <p className="why">{rule.why}</p>
            <dl className="props">
              <div>
                <dt>Customer</dt>
                <dd>
                  {selected.customer}
                  <span className="sub">{selected.priorClaims90d} earlier claims in 90 days</span>
                </dd>
              </div>
              <div>
                <dt>Item</dt>
                <dd>{selected.product}</dd>
              </div>
              <div>
                <dt>Reported</dt>
                <dd>{fmtDateTime(selected.at)}</dd>
              </div>
              <div>
                <dt>Reason</dt>
                <dd>{selected.reason}</dd>
              </div>
              <div>
                <dt>Photo check</dt>
                <dd>
                  {selected.ai
                    ? `${selected.ai.match ? 'Matches the item' : 'Does not match the item'} · ${selected.ai.issue} · ${Math.round(selected.ai.confidence * 100)}% sure`
                    : 'No photo sent'}
                </dd>
              </div>
              <div>
                <dt>Decision</dt>
                <dd>
                  <span className={`badge ${decisionBadge(selected.decision)}`}>{selected.decision}</span>
                </dd>
              </div>
              <div>
                <dt>Batch</dt>
                <dd>
                  <Link className="row-link" href={`/batches/${batch.id}`}>
                    {batch.id}
                  </Link>
                  <span className="sub">
                    {batch.source}, {batch.region}
                  </span>
                </dd>
              </div>
            </dl>
          </aside>
        )}
      </div>
    </div>
  );
}
