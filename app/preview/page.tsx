import type { Metadata } from 'next';
import Link from 'next/link';
import { PreviewWithSteps } from '@/components/PreviewWithSteps';

export const metadata: Metadata = { title: 'Customer preview' };

export default function Preview() {
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Customer preview</h1>
          <p>
            The two changes a shopper sees: a freshness card on fresh products, and a one-tap quality check after delivery
            with instant replacement. It works: add your own photo of a bad item to try the photo check.
          </p>
        </div>
        <Link className="btn" href="/docs/prd">
          Read the PRD
        </Link>
      </div>
      <PreviewWithSteps />
    </div>
  );
}
