// Run with: npm test
//
// adminSession.js imports next/server for adminGuard(); the functions tested
// here only use Web Crypto, so the module loads fine under plain node --test.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

const mod = await import('../src/lib/adminSession.js');
const {
    passcodeMatches, createSessionToken, verifySessionToken, getAdminSession,
    requireAdmin, adminLoginConfigured, SESSION_MAX_AGE,
} = mod;

const fakeRequest = (cookie) => ({ cookies: { get: (name) => (name === 'admin_session' && cookie !== undefined ? { value: cookie } : undefined) } });

beforeEach(() => {
    process.env.ADMIN_PASSCODE = '83920417';
    process.env.SESSION_SECRET = 'test-secret-0123456789abcdef';
});

test('not configured: no passcode matches and no token verifies', async () => {
    delete process.env.ADMIN_PASSCODE;
    assert.equal(adminLoginConfigured(), false);
    assert.equal(await passcodeMatches(''), false);
    assert.equal(await passcodeMatches('524862'), false);
    assert.equal(await verifySessionToken('v1.9999999999.abc'), false);
    await assert.rejects(() => createSessionToken());
});

test('passcode: right one matches, wrong and empty ones do not', async () => {
    assert.equal(await passcodeMatches('83920417'), true);
    assert.equal(await passcodeMatches('83920418'), false);
    assert.equal(await passcodeMatches('8392041'), false);
    assert.equal(await passcodeMatches(''), false);
    assert.equal(await passcodeMatches(83920417), false);
    assert.equal(await passcodeMatches({ $ne: '' }), false);
});

test('a fresh token verifies', async () => {
    const token = await createSessionToken();
    assert.match(token, /^v1\.\d+\.[0-9a-f]{64}$/);
    assert.equal(await verifySessionToken(token), true);
});

test('the old JSON cookie format is rejected', async () => {
    const old = JSON.stringify({ id: '1', email: 'admin@example.com', name: 'A', role: 'admin' });
    assert.equal(await verifySessionToken(old), false);
    assert.equal(await getAdminSession(fakeRequest(old)), null);
});

test('a tampered expiry or signature is rejected', async () => {
    const [v, exp, sig] = (await createSessionToken()).split('.');
    assert.equal(await verifySessionToken(`${v}.${Number(exp) + 86400}.${sig}`), false);
    const flipped = sig.slice(0, -1) + (sig.at(-1) === '0' ? '1' : '0');
    assert.equal(await verifySessionToken(`${v}.${exp}.${flipped}`), false);
    assert.equal(await verifySessionToken(`v2.${exp}.${sig}`), false);
    assert.equal(await verifySessionToken(''), false);
    assert.equal(await verifySessionToken(undefined), false);
});

test('a token expires after SESSION_MAX_AGE', async () => {
    const issued = Date.now();
    const token = await createSessionToken(issued);
    assert.equal(await verifySessionToken(token, issued + (SESSION_MAX_AGE - 60) * 1000), true);
    assert.equal(await verifySessionToken(token, issued + (SESSION_MAX_AGE + 1) * 1000), false);
});

test('changing the passcode signs everyone out', async () => {
    const token = await createSessionToken();
    process.env.ADMIN_PASSCODE = '11112222';
    assert.equal(await verifySessionToken(token), false);
});

test('changing SESSION_SECRET signs everyone out', async () => {
    const token = await createSessionToken();
    process.env.SESSION_SECRET = 'a-different-secret';
    assert.equal(await verifySessionToken(token), false);
});

test('requireAdmin accepts a valid cookie and refuses others', async () => {
    const ok = await requireAdmin(fakeRequest(await createSessionToken()));
    assert.equal(ok.ok, true);
    assert.equal(ok.user.role, 'admin');
    const missing = await requireAdmin(fakeRequest(undefined));
    assert.deepEqual([missing.ok, missing.status], [false, 401]);
    const forged = await requireAdmin(fakeRequest('{"email":"x"}'));
    assert.equal(forged.ok, false);
});
