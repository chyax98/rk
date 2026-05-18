import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { COMPONENTS, COMPONENTS_BY_TAG } from '../packages/components/src/index.ts';

describe('components catalog', () => {
  it('covers all registered component tags with no duplicates', () => {
    const tags = COMPONENTS.map((component) => component.tag);
    const uniqueTags = new Set(tags);
    assert.equal(tags.length, uniqueTags.size);
    assert.ok(tags.length >= 40);
    assert.ok(uniqueTags.has('rk-map'));
    assert.ok(uniqueTags.has('rk-globe'));
    assert.ok(uniqueTags.has('rk-field'));
  });

  it('keeps richer overrides for core components', () => {
    assert.equal(
      COMPONENTS_BY_TAG['rk-callout'].description,
      'Callout box with tone variant (info, warning, danger, success, tip, decision, note)',
    );
    assert.equal(COMPONENTS_BY_TAG['rk-grid'].childElements?.[0], 'rk-col');
    assert.equal(COMPONENTS_BY_TAG['rk-map'].derived, false);
    assert.equal(
      COMPONENTS_BY_TAG['rk-map'].description,
      'Interactive Leaflet map with marker array JSON input.',
    );
  });
});
