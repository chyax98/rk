import type React from 'react';
import {
  type ArtifactSort,
  type ArtifactView,
  getArtifactViewCounts,
  listArtifacts,
} from '@/lib/store.ts';
import ArtifactList from './ArtifactList.tsx';

const VIEWS: ArtifactView[] = ['active', 'archived', 'test', 'deleted'];
const SORTS: ArtifactSort[] = ['updated', 'title'];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; sort?: string; q?: string; tag?: string }>;
}): Promise<React.ReactElement> {
  const params = await searchParams;
  const view: ArtifactView = (VIEWS as string[]).includes(params.view ?? '')
    ? (params.view as ArtifactView)
    : 'active';
  const sort: ArtifactSort = (SORTS as string[]).includes(params.sort ?? '')
    ? (params.sort as ArtifactSort)
    : 'updated';
  const q = params.q?.trim() ?? '';
  const tag = params.tag?.trim() ?? '';

  const [artifacts, counts] = await Promise.all([
    listArtifacts({ view, sort, q: q || undefined, tag: tag || undefined }),
    getArtifactViewCounts(),
  ]);

  // Tag facet computed from current view's full set (not the q-filtered set) so the
  // sidebar/filter row stays stable while user types.
  const tagSource =
    q || tag
      ? await listArtifacts({ view, sort: 'updated' })
      : artifacts;
  const allTags = [...new Set(tagSource.flatMap((a) => a.tags))].sort();
  const tagCounts: Record<string, number> = Object.fromEntries(
    allTags.map((t) => [t, tagSource.filter((a) => a.tags.includes(t)).length]),
  );

  return (
    <ArtifactList
      initialArtifacts={artifacts}
      counts={counts}
      allTags={allTags}
      tagCounts={tagCounts}
      view={view}
      sort={sort}
      q={q}
      tag={tag}
    />
  );
}
