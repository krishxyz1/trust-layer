'use client';

import { useState } from 'react';
import { TRUST } from '@/lib/sample';
import { PhoneDemo } from './PhoneDemo';

const STEPS = [
  { screens: ['product'], title: 'Freshness card', body: 'Where the food came from, when it was picked, what was checked at the hub, and how other buyers of the same batch rated it.' },
  { screens: ['delivered'], title: 'Check after delivery', body: 'One tap per fresh item, right after the order arrives, while the problem is in front of the customer.' },
  { screens: ['claim', 'checking'], title: 'Report a problem', body: 'Pick what went wrong and add a photo if you like. A vision model checks whether the photo shows the item and the problem.' },
  { screens: ['result'], title: 'Instant decision', body: `Approved instantly when the photo shows the problem, or on trust under ₹${TRUST.autoValueRs} for customers with ${TRUST.maxPriorClaims} or fewer claims in 90 days. Everything else goes to a person within 10 minutes.` },
];

export function PreviewWithSteps() {
  const [screen, setScreen] = useState('product');
  return (
    <div className="preview">
      <PhoneDemo onStep={setScreen} />
      <div className="panel">
        <div className="section-head">
          <h2>How it works</h2>
        </div>
        <ol className="steps">
          {STEPS.map((s) => (
            <li key={s.title} aria-current={s.screens.includes(screen) ? 'step' : undefined}>
              <span>
                {s.title}
                <span className="sub">{s.body}</span>
              </span>
            </li>
          ))}
        </ol>
        <div className="section-head">
          <h2>Behind the screen</h2>
        </div>
        <ul className="checks">
          <li>
            <span>Every claim is tied to a batch</span>
            <span className="muted">so a bad lot is pulled, not just refunded</span>
          </li>
          <li>
            <span>Same decision rule everywhere</span>
            <span className="muted">customer app and ops console</span>
          </li>
          <li>
            <span>Photos are only used for the check</span>
            <span className="muted">resized on the phone first</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
