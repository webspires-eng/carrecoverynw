// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    clampInt, parsePaging, escapeRegex, searchRegex, MAX_PAGE_SIZE, MAX_SEARCH_LENGTH,
} from '../src/lib/queryGuards.js';

const params = (query) => new URLSearchParams(query);

test('clampInt keeps values inside the range', () => {
    assert.equal(clampInt('50', { min: 1, max: 100, fallback: 25 }), 50);
    assert.equal(clampInt('100000', { min: 1, max: 100, fallback: 25 }), 100);
    assert.equal(clampInt('-5', { min: 1, max: 100, fallback: 25 }), 1);
    assert.equal(clampInt('0', { min: 1, max: 100, fallback: 25 }), 1);
});

test('clampInt falls back on missing or unreadable input', () => {
    for (const bad of [null, undefined, '', 'abc', 'NaN', 'Infinity']) {
        assert.equal(clampInt(bad, { min: 1, max: 100, fallback: 25 }), 25);
    }
});

test('parsePaging uses defaults when nothing is passed', () => {
    assert.deepEqual(parsePaging(params('')), { page: 1, limit: 25, offset: 0 });
});

test('parsePaging computes the offset', () => {
    assert.deepEqual(parsePaging(params('page=3&limit=50')), { page: 3, limit: 50, offset: 100 });
});

test('parsePaging never exceeds the ceiling', () => {
    assert.equal(parsePaging(params('limit=999999999')).limit, MAX_PAGE_SIZE);
    assert.equal(parsePaging(params('limit=5000'), { maxLimit: 200 }).limit, 200);
});

test('parsePaging never produces a negative offset', () => {
    const paging = parsePaging(params('page=-4&limit=-10'));
    assert.deepEqual(paging, { page: 1, limit: 1, offset: 0 });
});

test('escapeRegex neutralises every metacharacter', () => {
    const nasty = '.*+?^${}()|[]\\';
    assert.ok(new RegExp(`^${escapeRegex(nasty)}$`).test(nasty));
    assert.equal(new RegExp(escapeRegex('a.c')).test('abc'), false);
});

test('searchRegex matches literally and ignores case', () => {
    assert.ok(searchRegex('lond').test('East London'));
    assert.equal(searchRegex('.*').test('London'), false);
});

test('searchRegex does not throw on input that is an invalid pattern', () => {
    for (const bad of ['(', '[', '*', '\\', '(a+)+$']) {
        assert.doesNotThrow(() => searchRegex(bad));
    }
});

test('searchRegex returns null when there is nothing to search', () => {
    for (const empty of ['', '   ', null, undefined]) {
        assert.equal(searchRegex(empty), null);
    }
});

test('searchRegex caps the length of the search text', () => {
    const long = 'a'.repeat(MAX_SEARCH_LENGTH + 500);
    assert.equal(searchRegex(long).source.length, MAX_SEARCH_LENGTH);
});

test('a hostile pattern is matched fast because it is literal', () => {
    const started = Date.now();
    searchRegex('(a+)+$').test('a'.repeat(5000) + '!');
    assert.ok(Date.now() - started < 100);
});
