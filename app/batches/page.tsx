import type { Metadata } from 'next';
import Link from 'next/link';
import { PULL_RULE, WATCH_RULE, batches, claimRate, fmtDate, statusOf } from '@/lib/sample';

export const metadata: Metadata = { title: 'Batches' };

const STATUS = {
  live: { label: 'On shelf', cls: 'ok' },
  watch: { label: 'Watching', cls: 'warn' },
  pulled: { label: 'Pulled', cls: 'bad' },
} as const;

export default function Batches() {
  const rows = [...batches].sort((a, b) => claimRate(b) - claimRate(a));
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Batches</h1>
          <p>
            Every lot from farm to dark store. A batch is watched at {WATCH_RULE.perThousand} claims per 1,000 units and
            pulled from every store at {PULL_RULE.perThousand}, or after {PULL_RULE.healthClaims} health-risk claims.
          </p>
        </div>
        <span className="sample-note">Sample data</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Batch</th>
              <th>Source</th>
              <th>Harvested</th>
              <th>Grade</th>
              <th className="num">Units sold</th>
              <th className="num">Claims / 1,000</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => {
              const s = STATUS[statusOf(b)];
              return (
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
                  <td>{fmtDate(b.harvested)}</td>
                  <td>{b.grade}</td>
                  <td className="num">{b.unitsSold.toLocaleString('en-IN')}</td>
                  <td className="num">{claimRate(b).toFixed(1)}</td>
                  <td>
                    <span className={`badge ${s.cls}`}>{s.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
