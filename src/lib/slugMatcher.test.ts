/**
 * Unit tests for slugMatcher — covers all 8 normalisation rules.
 *
 * Run with:  node --test --import=tsx src/lib/slugMatcher.test.ts
 *       or:  npx tsx --test src/lib/slugMatcher.test.ts
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchNameToSlug, buildSubAreasHTML } from './slugMatcher';

const slugs = [
    'kensington',
    'fulham',
    'milton-keynes',
    'shepherds-bush',
    'saint-albans',
    'st-helens',
    'westminster',
    'camden',
    'barrow-furness',
    'newcastle-upon-tyne',
    'stratford-upon-avon',
];

test('rule 1 — trims whitespace', () => {
    assert.equal(matchNameToSlug('  kensington  ', slugs), 'kensington');
});

test('rule 2 — lowercases input', () => {
    assert.equal(matchNameToSlug('KENSINGTON', slugs), 'kensington');
    assert.equal(matchNameToSlug('Fulham', slugs), 'fulham');
});

test('rule 3 — removes apostrophes (straight and curly)', () => {
    assert.equal(matchNameToSlug("Shepherd's Bush", slugs), 'shepherds-bush');
    assert.equal(matchNameToSlug('Shepherd’s Bush', slugs), 'shepherds-bush');
});

test('rule 4 — replaces spaces and underscores with hyphens', () => {
    assert.equal(matchNameToSlug('Milton Keynes', slugs), 'milton-keynes');
    assert.equal(matchNameToSlug('milton_keynes', slugs), 'milton-keynes');
});

test('rule 5 — strips special characters except hyphens', () => {
    assert.equal(matchNameToSlug('Kensington!', slugs), 'kensington');
    assert.equal(matchNameToSlug('Newcastle-upon-Tyne', slugs), 'newcastle-upon-tyne');
});

test('rule 6 — direct match against allSlugs', () => {
    assert.equal(matchNameToSlug('westminster', slugs), 'westminster');
});

test('rule 7a — st <-> saint swap (st → saint)', () => {
    assert.equal(matchNameToSlug('St Albans', slugs), 'saint-albans');
});

test('rule 7a — saint <-> st swap (saint → st)', () => {
    assert.equal(matchNameToSlug('Saint Helens', slugs), 'st-helens');
});

test('rule 7b — strip london-borough-of- prefix', () => {
    assert.equal(matchNameToSlug('London Borough of Camden', slugs), 'camden');
});

test('rule 7c — strip royal-borough-of- prefix', () => {
    assert.equal(matchNameToSlug('Royal Borough of Kensington', slugs), 'kensington');
});

test('rule 7d — strip city-of- prefix', () => {
    assert.equal(matchNameToSlug('City of Westminster', slugs), 'westminster');
});

test('rule 7e — collapse -and- to -', () => {
    assert.equal(matchNameToSlug('Barrow and Furness', slugs), 'barrow-furness');
});

test('rule 8 — returns null when nothing matches', () => {
    assert.equal(matchNameToSlug('Atlantis', slugs), null);
    assert.equal(matchNameToSlug('', slugs), null);
});

test('buildSubAreasHTML — handles array input', () => {
    const result = buildSubAreasHTML(
        ['Kensington', 'Fulham', 'Atlantis'],
        slugs,
        'westminster'
    );
    assert.equal(result.total, 3);
    assert.equal(result.linked, 2);
    assert.deepEqual(result.html, [
        { name: 'Kensington', slug: 'kensington' },
        { name: 'Fulham', slug: 'fulham' },
        { name: 'Atlantis', slug: null },
    ]);
});

test('buildSubAreasHTML — handles comma-separated string', () => {
    const result = buildSubAreasHTML(
        'Kensington, Fulham, Atlantis',
        slugs,
        'westminster'
    );
    assert.equal(result.total, 3);
    assert.equal(result.linked, 2);
});

test('buildSubAreasHTML — handles newline-separated string', () => {
    const result = buildSubAreasHTML(
        'Kensington\nFulham\nAtlantis',
        slugs,
        'westminster'
    );
    assert.equal(result.total, 3);
    assert.equal(result.linked, 2);
});

test('buildSubAreasHTML — excludes self-link to currentSlug', () => {
    const result = buildSubAreasHTML(
        ['Kensington', 'Fulham'],
        slugs,
        'kensington'
    );
    assert.equal(result.linked, 1);
    assert.equal(result.html[0].slug, null); // current page
    assert.equal(result.html[1].slug, 'fulham');
});

test('buildSubAreasHTML — deduplicates by name', () => {
    const result = buildSubAreasHTML(
        ['Kensington', 'kensington', 'KENSINGTON'],
        slugs,
        'westminster'
    );
    assert.equal(result.total, 1);
});
