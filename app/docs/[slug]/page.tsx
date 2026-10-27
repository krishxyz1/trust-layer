import fs from 'node:fs';
import path from 'node:path';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { marked } from 'marked';

const DOCS = {
  prd: { file: 'prd.md', title: 'PRD' },
  'metric-tree': { file: 'metric-tree.md', title: 'Metric tree' },
  experiment: { file: 'experiment.md', title: 'Experiment plan' },
} as const;
type Slug = keyof typeof DOCS;

export function generateStaticParams() {
  return Object.keys(DOCS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<'/docs/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  return { title: DOCS[slug as Slug]?.title ?? 'Docs' };
}

export default async function Doc({ params }: PageProps<'/docs/[slug]'>) {
  const { slug } = await params;
  const doc = DOCS[slug as Slug];
  if (!doc) notFound();
  // The docs are our own markdown files in the repo, rendered at build time.
  const md = fs.readFileSync(path.join(process.cwd(), 'docs', doc.file), 'utf8');
  const html = await marked.parse(md);
  return (
    <div className="page">
      <article className="doc" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
