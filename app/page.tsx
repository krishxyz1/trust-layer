import Link from 'next/link';
import { PULL_RULE, TODAY, batches, claimRate, claims, daily, fmtDate, rs, statusOf, type Category } from '@/lib/sample';

const DAY = 86_400_000;
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : 0;
};

export default function Home() {
  const week = claims.filter((c) => c.at > TODAY - 7 * DAY);
  const resolved = week.filter((c) => c.minutesToResolve !== null);
  const auto = week.filter((c) => c.decision === 'Replaced' || c.decision === 'Refunded');
  const freshUnits = batches.reduce((s, b) => s + b.unitsSold, 0);
  const rate = (batches.reduce((s, b) => s + b.claims, 0) / freshUnits) * 1000;
  const cost = claims.filter((c) => c.decision !== 'Declined' && c.decision !== 'In review').reduce((s, c) => s + c.valueRs, 0);
  const gmv = batches.reduce((s, b) => s + b.unitsSold * b.priceRs, 0);

  const atRisk = batches
    .map((b) => ({ b, status: statusOf(b), rate: claimRate(b) }))
    .filter((x) => x.status !== 'live')
    .sort((a, b) => b.rate - a.rate);

  const byCategory = (['Fruit and veg', 'Dairy and eggs', 'Bakery'] as Category[]).map((cat) => {
    const bs = batches.filter((b) => b.category === cat);
    const units = bs.reduce((s, b) => s + b.unitsSold, 0);
    const cl = bs.reduce((s, b) => s + b.claims, 0);
    return { cat, rate: (cl / units) * 1000 };
  });
  const maxCat = Math.max(...byCategory.map((c) => c.rate), PULL_RULE.perThousand);
  const maxDay = Math.max(...daily.map((d) => d.claims));

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Today</h1>
          <p>Fresh-quality claims, how fast they were resolved, and the batches causing them.</p>
        </div>
        <span className="sample-note">Sample data</span>
      </div>

      <div className="kpis">
        <div className="kpi">
          <span className="kpi-label">Claims, last 7 days</span>
          <span className="kpi-value">{week.length}</span>
          <span className="kpi-sub">{rate.toFixed(1)} per 1,000 fresh units overall</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Resolved instantly</span>
          <span className="kpi-value">{Math.round((auto.length / Math.max(1, week.length)) * 100)}%</span>
          <span className="kpi-sub">Photo check or trust rule, no agent</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Median time to resolve</span>
          <span className="kpi-value">{median(resolved.map((c) => c.minutesToResolve!))} min</span>
          <span className="kpi-sub">From claim to replacement or refund</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Cost of claims</span>
          <span className="kpi-value">{((cost / gmv) * 100).toFixed(2)}%</span>
          <span className="kpi-sub">
            {rs(cost)} of {rs(gmv)} fresh sales
          </span>
        </div>
      </div>

      <div className="two">
        <section className="panel" aria-labelledby="daily-h">
          <div className="section-head">
            <h2 id="daily-h">Claims per day</h2>
            <span className="legend">
              <span>
                <i style={{ background: 'var(--accent)' }} />
                Resolved instantly
              </span>
              <span>
                <i style={{ background: '#d6daf9' }} />
                All claims
              </span>
            </span>
          </div>
          <div className="bars" role="img" aria-label="Claims per day over the last 14 days, split by instantly resolved">
            {daily.map((d) => (
              <div key={d.day} title={`${fmtDate(d.day)}: ${d.claims} claims, ${d.auto} resolved instantly`}>
                <span className="total" style={{ height: `${(d.claims / maxDay) * 100}%` }}>
                  <span className="auto" style={{ height: d.claims ? `${(d.auto / d.claims) * 100}%` : 0 }} />
                </span>
              </div>
            ))}
          </div>
          <div className="bars-axis" aria-hidden="true">
            {daily.map((d) => (
              <span key={d.day}>{new Date(d.day).getUTCDate()}</span>
            ))}
          </div>
        </section>

        <section className="panel" aria-labelledby="cat-h">
          <div className="section-head">
            <h2 id="cat-h">Claim rate by category</h2>
            <span className="muted">per 1,000 units</span>
          </div>
          <div className="meter">
            {byCategory.map((c) => (
              <div className="meter-row" key={c.cat}>
                <span>{c.cat}</span>
                <span className="meter-track" aria-hidden="true">
                  <span style={{ width: `${(c.rate / maxCat) * 100}%` }} />
                  <i style={{ left: `${(PULL_RULE.perThousand / maxCat) * 100}%` }} />
                </span>
                <span className="num">{c.rate.toFixed(1)}</span>
              </div>
            ))}
          </div>
          <p className="muted">The red tick is the auto-pull line: a batch at {PULL_RULE.perThousand} claims per 1,000 units comes off the shelf.</p>
        </section>
      </div>

      <section className="section" aria-labelledby="risk-h">
        <div className="section-head">
          <h2 id="risk-h">Batches that need attention</h2>
          <Link href="/batches">All batches</Link>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Batch</th>
                <th>Source</th>
                <th className="num">Claims / 1,000</th>
                <th className="num">Health-risk claims</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {atRisk.map(({ b, status, rate: r }) => (
                <tr key={b.id}>
                  <td>
                    <Link className="row-link" href={`/batches/${b.id}`}>
                      {b.product}
                    </Link>
                    <span className="sub">{b.id}</span>
                  </td>
                  <td>
                    {b.source}
                    <span className="sub">{b.region}</span>
                  </td>
                  <td className="num">{r.toFixed(1)}</td>
                  <td className="num">{b.healthClaims}</td>
                  <td>
                    {status === 'pulled' ? <span className="badge bad">Pulled from shelves</span> : <span className="badge warn">Watching</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
