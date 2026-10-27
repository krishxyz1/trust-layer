'use client';

import { useState } from 'react';
import { TRUST, decide, type Claim } from '@/lib/sample';

/* The customer side of the trust layer, as a working prototype:
   1. a product page whose freshness card shows where and when the food came from,
   2. a post-delivery check on each fresh item,
   3. a claim with an optional photo that is checked by a model, then decided by the
      same rule the ops console uses. */

type Item = { key: string; name: string; batch: string; source: string; harvested: string; priceRs: number; icon: 'tomato' | 'leaf' | 'curd' };

const ITEMS: Item[] = [
  { key: 'tom', name: 'Tomato, hybrid, 500 g', batch: 'TOM-1025-B', source: 'Srinivasa FPO, Kolar', harvested: '25 Oct, 6:10 am', priceRs: 34, icon: 'tomato' },
  { key: 'spi', name: 'Spinach, 250 g bunch', batch: 'SPI-1026-A', source: 'Hosahalli Greens, Chikkaballapur', harvested: '26 Oct, 5:40 am', priceRs: 29, icon: 'leaf' },
  { key: 'cur', name: 'Set curd, 400 g', batch: 'SET-1019-B', source: 'Kanakapura Dairy Co-op', harvested: 'Set 26 Oct, 9 pm', priceRs: 52, icon: 'curd' },
];

const REASONS: Claim['reason'][] = ['Spoiled', 'Bruised or damaged', 'Expired', 'Wrong item', 'Missing'];

type Screen = 'product' | 'delivered' | 'claim' | 'checking' | 'result';

function Icon({ kind, size = 28 }: { kind: Item['icon']; size?: number }) {
  if (kind === 'tomato')
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="18" r="11" fill="#d8432f" />
        <path d="M16 7c-2 0-4 1-5 2 2 0 3 1 5 1s3-1 5-1c-1-1-3-2-5-2Z" fill="#3f8a4f" />
        <path d="M16 5v4" stroke="#3f8a4f" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  if (kind === 'leaf')
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
        <path d="M6 26C6 14 13 6 26 6c0 13-8 20-20 20Z" fill="#3f8a4f" />
        <path d="M6 26 18 14" stroke="#e5f1e9" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <path d="M7 11h18l-2 15H9z" fill="#f4efe2" stroke="#b9ad8f" strokeWidth="1.5" />
      <rect x="6" y="7" width="20" height="5" rx="2" fill="#4b7bbf" />
    </svg>
  );
}

async function shrink(file: File): Promise<{ data: string; mime: string; url: string }> {
  const url = URL.createObjectURL(file);
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = url;
  });
  const scale = Math.min(1, 768 / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
  return { data: dataUrl.split(',')[1], mime: 'image/jpeg', url };
}

export function PhoneDemo({ onStep }: { onStep?: (s: Screen) => void }) {
  const [screen, setScreenRaw] = useState<Screen>('product');
  const [verdicts, setVerdicts] = useState<Record<string, 'ok' | 'bad'>>({});
  const [item, setItem] = useState<Item>(ITEMS[0]);
  const [reason, setReason] = useState<Claim['reason']>('Spoiled');
  const [photo, setPhoto] = useState<{ data: string; mime: string; url: string } | null>(null);
  const [error, setError] = useState('');
  const [outcome, setOutcome] = useState<{
    decision: Claim['decision'];
    why: string;
    ai: { match: boolean; issue: string; confidence: number; note: string } | null;
  } | null>(null);

  const setScreen = (s: Screen) => {
    setScreenRaw(s);
    onStep?.(s);
  };

  async function submit() {
    setError('');
    setScreen('checking');
    let ai: { match: boolean; issue: string; confidence: number; note: string } | null = null;
    if (photo) {
      try {
        const res = await fetch('/api/check-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: photo.data, mime: photo.mime, item: item.name, reason }),
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json.error ?? 'The photo check failed.');
          setScreen('claim');
          return;
        }
        ai = { match: json.match, issue: json.issue, confidence: json.confidence, note: json.note };
      } catch {
        setError('Could not reach the photo check. Try again or send without a photo.');
        setScreen('claim');
        return;
      }
    }
    // This shopper has no earlier claims; the rule also handles repeat claimers.
    const rule = decide({ photo: Boolean(ai), ai, valueRs: item.priceRs, priorClaims90d: 0, reason });
    setOutcome({ ...rule, ai });
    setScreen('result');
  }

  const reset = () => {
    setVerdicts({});
    setPhoto(null);
    setOutcome(null);
    setError('');
    setScreen('product');
  };

  return (
    <div className="phone" aria-label="Customer app prototype">
      <div className="screen">
        {screen === 'product' && (
          <>
            <div className="app-bar">
              <span>Fruit and vegetables</span>
            </div>
            <div className="app-body">
              <div className="product-hero">
                <Icon kind="tomato" size={96} />
              </div>
              <div>
                <p className="p-title">{ITEMS[0].name}</p>
                <p className="p-meta">Best eaten within 4 days · ripens on the counter</p>
              </div>
              <p className="p-price">₹{ITEMS[0].priceRs}</p>
              <details className="fresh-card" open>
                <summary>
                  <span className="fresh-icon" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path d="M9 12l2 2 4-4M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                    </svg>
                  </span>
                  <span>
                    <b>Picked 2 days ago in Kolar</b>
                    <small>Checked at our hub · batch {ITEMS[0].batch}</small>
                  </span>
                  <svg className="chev" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </summary>
                <div className="fresh-body">
                  <ol className="journey">
                    <li>
                      <span className="dot" aria-hidden="true" />
                      <span>
                        <b>Harvested</b>
                        <span className="sub">{ITEMS[0].source}</span>
                      </span>
                      <span>25 Oct</span>
                    </li>
                    <li>
                      <span className="dot" aria-hidden="true" />
                      <span>
                        <b>Graded at our hub</b>
                        <span className="sub">Firmness and colour checked · 6% set aside</span>
                      </span>
                      <span>25 Oct</span>
                    </li>
                    <li>
                      <span className="dot" aria-hidden="true" />
                      <span>
                        <b>At your nearest store</b>
                        <span className="sub">Kept at 10 °C</span>
                      </span>
                      <span>26 Oct</span>
                    </li>
                  </ol>
                  <p className="batch-score">
                    <span>Buyers of this batch who rated it fresh</span>
                    <b>96%</b>
                  </p>
                  <p className="promise">Not fresh when it arrives? Tell us after delivery and we replace it, usually within 15 minutes.</p>
                </div>
              </details>
            </div>
            <div className="app-cta">
              <button className="p-btn" type="button" onClick={() => setScreen('delivered')}>
                Add to cart and order
              </button>
            </div>
          </>
        )}

        {screen === 'delivered' && (
          <>
            <div className="app-bar">
              <span>Order delivered</span>
            </div>
            <div className="app-body">
              <div>
                <p className="p-title">How was everything?</p>
                <p className="p-meta">Delivered 12 min ago · one tap per item</p>
              </div>
              {ITEMS.map((it) => (
                <div className="order-item" key={it.key}>
                  <span className="order-thumb">
                    <Icon kind={it.icon} />
                  </span>
                  <div>
                    <b>{it.name}</b>
                    <div className="verdict" role="group" aria-label={`Rate ${it.name}`}>
                      <button
                        type="button"
                        className="chip-btn"
                        aria-pressed={verdicts[it.key] === 'ok'}
                        onClick={() => setVerdicts((v) => ({ ...v, [it.key]: 'ok' }))}
                      >
                        Fresh
                      </button>
                      <button
                        type="button"
                        className="chip-btn bad"
                        aria-pressed={verdicts[it.key] === 'bad'}
                        onClick={() => {
                          setVerdicts((v) => ({ ...v, [it.key]: 'bad' }));
                          setItem(it);
                          setReason('Spoiled');
                          setPhoto(null);
                          setScreen('claim');
                        }}
                      >
                        Not right
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="app-cta">
              <button className="p-btn ghost" type="button" onClick={reset}>
                Start over
              </button>
            </div>
          </>
        )}

        {(screen === 'claim' || screen === 'checking') && (
          <>
            <div className="app-bar">
              <button type="button" aria-label="Back" onClick={() => setScreen('delivered')} disabled={screen === 'checking'}>
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
              <span>{item.name}</span>
            </div>
            <div className="app-body">
              <p className="p-title">What went wrong?</p>
              <div className="chips" role="radiogroup" aria-label="Reason">
                {REASONS.map((r) => (
                  <button key={r} type="button" role="radio" className="chip-btn bad" aria-checked={reason === r} onClick={() => setReason(r)}>
                    {r}
                  </button>
                ))}
              </div>
              {reason !== 'Missing' && (
                <label className="upload">
                  {photo ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.url} alt="Your photo of the item" />
                      <span>Tap to change the photo</span>
                    </>
                  ) : (
                    <>
                      <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                      </svg>
                      <b>Add a photo</b>
                      <span>Optional. With a clear photo most claims are approved in seconds.</span>
                    </>
                  )}
                  <input
                    className="sr-only"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      try {
                        setPhoto(await shrink(f));
                        setError('');
                      } catch {
                        setError('That file could not be read as a photo.');
                      }
                    }}
                  />
                </label>
              )}
              {error && (
                <p className="err" role="alert">
                  {error}
                </p>
              )}
              {screen === 'checking' && (
                <div className="result-card" aria-live="polite">
                  <span className="spin" aria-hidden="true" />
                  <b>{photo ? 'Checking your photo…' : 'Sending…'}</b>
                </div>
              )}
            </div>
            <div className="app-cta">
              <button className="p-btn" type="button" onClick={submit} disabled={screen === 'checking'}>
                {photo ? 'Send with photo' : 'Send without photo'}
              </button>
            </div>
          </>
        )}

        {screen === 'result' && outcome && (
          <>
            <div className="app-bar">
              <span>{item.name}</span>
            </div>
            <div className="app-body">
              <div className={`result-card ${outcome.decision === 'In review' ? 'review' : 'ok'}`} aria-live="polite">
                <h3>
                  {outcome.decision === 'Replaced'
                    ? 'A fresh replacement is on its way'
                    : outcome.decision === 'Refunded'
                      ? `₹${item.priceRs} is back in your wallet`
                      : 'A person will look at this in 10 minutes'}
                </h3>
                <p>
                  {outcome.decision === 'Replaced'
                    ? 'Arriving in about 15 minutes. Keep or throw away the old one, no need to return it.'
                    : outcome.decision === 'Refunded'
                      ? 'Refunded instantly. Sorry this one went wrong.'
                      : 'We will message you here. If it is approved, the replacement leaves straight away.'}
                </p>
              </div>
              {outcome.ai && (
                <div className="ai-box">
                  <b>What the photo check saw</b>
                  <span>{outcome.ai.note || outcome.ai.issue}</span>
                  <span>
                    {outcome.ai.match ? 'Matches your item' : 'Does not look like your item'} · {outcome.ai.issue}
                    {outcome.ai.confidence > 0 && ` · ${Math.round(outcome.ai.confidence * 100)}% sure`}
                  </span>
                </div>
              )}
              <div className="ai-box">
                <b>Why this decision</b>
                <span>{outcome.why}</span>
              </div>
              <div className="ai-box">
                <b>What happens to batch {item.batch}</b>
                <span>Your report is counted against this batch. If reports pass 15 per 1,000 units, it comes off every shelf.</span>
              </div>
            </div>
            <div className="app-cta">
              <button className="p-btn ghost" type="button" onClick={reset}>
                Try another claim
              </button>
            </div>
          </>
        )}
      </div>
      <span className="sr-only">Instant approval limit: ₹{TRUST.autoValueRs}</span>
    </div>
  );
}
