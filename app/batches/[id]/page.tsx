import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PULL_RULE, batches, claimRate, claims, fmtDate, fmtDateTime, statusOf } from '@/lib/sample';

export async function generateMetadata({ params }: PageProps<'/batches/[id]'>): Promise<Metadata> {
  const { id } = await params;
  return { title: `Batch ${id}` };
}

export function generateStaticParams() {
  return batches.map((b) => ({ id: b.id }));
}

export default async function BatchPage({ params }: PageProps<'/batches/[id]'>) {
  const { id } = await params;
  const b = batches.find((x) => x.id === id);
  if (!b) notFound();
  const status = statusOf(b);
  const its = claims.filter((c) => c.batchId === b.id);
  const reasons = Object.entries(
    its.reduce<Record<string, number>>((acc, c) => ((acc[c.reason] = (acc[c.reason] ?? 0) + 1), acc), {}),
  ).sort((x, y) => y[1] - x[1]);
  const hot = b.coldChain.find((s) => s.tempC !== null && s.tempC >= (b.category === 'Fruit and veg' ? 13 : 7));

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <p>
            <Link href="/batches" className="muted">
              Batches
            </Link>{' '}
            / {b.id}
          </p>
          <h1>{b.product}</h1>
          <p>
            {b.source}, {b.region}
          </p>
        </div>
        <span className={`badge ${status === 'pulled' ? 'bad' : status === 'watch' ? 'warn' : 'ok'}`}>
          {status === 'pulled' ? 'Pulled from shelves' : status === 'watch' ? 'Watching' : 'On shelf'}
        </span>
      </div>

      <div className="kpis">
        <div className="kpi">
          <span className="kpi-label">Units sold</span>
          <span className="kpi-value">{b.unitsSold.toLocaleString('en-IN')}</span>
          <span className="kpi-sub">across {b.stores.length} dark stores</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Claims per 1,000</span>
          <span className="kpi-value">{claimRate(b).toFixed(1)}</span>
          <span className="kpi-sub">pulled at {PULL_RULE.perThousand}</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Health-risk claims</span>
          <span className="kpi-value">{b.healthClaims}</span>
          <span className="kpi-sub">pulled at {PULL_RULE.healthClaims}</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Rejected at grading</span>
          <span className="kpi-value">{(b.rejectedAtHub * 100).toFixed(1)}%</span>
          <span className="kpi-sub">grade {b.grade}</span>
        </div>
      </div>

      <div className="two">
        <section className="panel" aria-labelledby="journey-h">
          <div className="section-head">
            <h2 id="journey-h">Farm to door</h2>
          </div>
          <ol className="journey">
            {b.coldChain.map((s) => (
              <li key={s.stage}>
                <span className={`dot${s === hot ? ' warn' : ''}`} aria-hidden="true" />
                <span>
                  <b>{s.stage}</b>
                  <span className="sub">{fmtDateTime(s.at)}</span>
                </span>
                <span className={s === hot ? 'badge bad' : 'muted'}>{s.tempC === null ? '–' : `${s.tempC} °C`}</span>
              </li>
            ))}
          </ol>
          {hot && (
            <p className="why">
              Temperature rose to {hot.tempC} °C at “{hot.stage.toLowerCase()}”. That is the likeliest cause of the claims, so
              the fix belongs to that leg of the chain, not to the farm.
            </p>
          )}
        </section>

        <section className="panel" aria-labelledby="qc-h">
          <div className="section-head">
            <h2 id="qc-h">Checks at grading</h2>
            <span className="muted">{fmtDate(b.graded)}</span>
          </div>
          <ul className="checks">
            {b.checks.map((c) => (
              <li key={c.name}>
                <span>{c.name}</span>
                <span className={c.pass ? '' : 'badge warn'}>{c.value}</span>
              </li>
            ))}
          </ul>
          <div className="section-head">
            <h2>Claims by reason</h2>
          </div>
          {reasons.length ? (
            <ul className="checks">
              {reasons.map(([r, n]) => (
                <li key={r}>
                  <span>{r}</span>
                  <b>{n}</b>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No claims on this batch.</p>
          )}
        </section>
      </div>

      <section className="section" aria-labelledby="claims-h">
        <div className="section-head">
          <h2 id="claims-h">Recent claims on this batch</h2>
          <Link href="/claims">All claims</Link>
        </div>
        {its.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Claim</th>
                  <th>Reason</th>
                  <th>Decision</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {its.slice(0, 8).map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link className="row-link" href={`/claims?id=${c.id}`}>
                        {c.id}
                      </Link>
                    </td>
                    <td>{c.reason}</td>
                    <td>{c.decision}</td>
                    <td>{fmtDateTime(c.at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">No claims yet.</p>
        )}
      </section>
    </div>
  );
}
