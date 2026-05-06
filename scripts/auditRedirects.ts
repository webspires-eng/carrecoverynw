/**
 * Redirect chain auditor.
 *
 * Paste the URLs exported from Search Console into INPUT_URLS below
 * (one per line in the array), then run:
 *
 *   npx tsx scripts/auditRedirects.ts
 *   (or: npx ts-node scripts/auditRedirects.ts)
 *
 * Output: ./scripts/output/redirect-audit.json + console report.
 */
import fs from 'fs';
import path from 'path';

const CANONICAL_HOST = 'www.cartowingnearme.co.uk';
const MAX_HOPS = 10;

const INPUT_URLS: string[] = [
    'https://cartowingnearme.co.uk/area/london-borough-of-lambeth',
    'https://cartowingnearme.co.uk/areas/braintree',
    'https://www.cartowingnearme.co.uk/area/ashford',
    'https://www.cartowingnearme.co.uk/area/barnstaple',
    'http://www.cartowingnearme.co.uk/',
    'https://cartowingnearme.co.uk/area/aylesbury',
    'https://www.cartowingnearme.co.uk/area/aylesbury',
    'http://cartowingnearme.co.uk/',
    'https://cartowingnearme.co.uk/',
    'https://cartowingnearme.co.uk/areas/buxton',
];

type Hop = {
    url: string;
    status: number;
    location: string | null;
};

type Issue =
    | 'CHAIN_TOO_LONG'
    | 'LOOP'
    | 'ENDS_IN_404'
    | 'ENDS_IN_5XX'
    | 'ENDS_IN_NON_2XX'
    | 'MIXED_HTTP_HTTPS'
    | 'WWW_INCONSISTENCY'
    | 'MIXED_301_302'
    | 'EMPTY_LOCATION'
    | 'MAX_HOPS_EXCEEDED'
    | 'NETWORK_ERROR';

type AuditEntry = {
    inputUrl: string;
    finalUrl: string | null;
    finalStatus: number | null;
    hopCount: number;
    chain: Hop[];
    issues: Issue[];
    summary: string;
    suggestedFix: string;
};

function resolveLocation(base: string, location: string): string {
    try {
        return new URL(location, base).toString();
    } catch {
        return location;
    }
}

async function followChain(startUrl: string): Promise<{ chain: Hop[]; issues: Issue[] }> {
    const chain: Hop[] = [];
    const issues = new Set<Issue>();
    const visited = new Set<string>();
    let current = startUrl;

    for (let i = 0; i < MAX_HOPS; i++) {
        if (visited.has(current)) {
            issues.add('LOOP');
            break;
        }
        visited.add(current);

        let res: Response;
        try {
            res = await fetch(current, {
                redirect: 'manual',
                headers: { 'User-Agent': 'CarRecoveryUK-RedirectAuditor/1.0' },
            });
        } catch (err) {
            issues.add('NETWORK_ERROR');
            chain.push({ url: current, status: 0, location: null });
            break;
        }

        const location = res.headers.get('location');
        chain.push({ url: current, status: res.status, location });

        const isRedirect = res.status >= 300 && res.status < 400;
        if (!isRedirect) break;

        if (!location) {
            issues.add('EMPTY_LOCATION');
            break;
        }

        const next = resolveLocation(current, location);

        const fromUrl = new URL(current);
        const toUrl = (() => { try { return new URL(next); } catch { return null; } })();
        if (toUrl) {
            if (fromUrl.protocol !== toUrl.protocol) issues.add('MIXED_HTTP_HTTPS');
            const fromHost = fromUrl.hostname.replace(/^www\./, '');
            const toHost = toUrl.hostname.replace(/^www\./, '');
            if (fromHost === toHost && fromUrl.hostname !== toUrl.hostname) {
                issues.add('WWW_INCONSISTENCY');
            }
        }

        current = next;

        if (i === MAX_HOPS - 1) issues.add('MAX_HOPS_EXCEEDED');
    }

    return { chain, issues: Array.from(issues) };
}

function classify(entry: { chain: Hop[]; issues: Issue[]; inputUrl: string }): AuditEntry {
    const { chain, issues, inputUrl } = entry;
    const issueSet = new Set<Issue>(issues);

    const redirectHops = chain.filter((h) => h.status >= 300 && h.status < 400).length;
    if (redirectHops > 1) issueSet.add('CHAIN_TOO_LONG');

    const statuses = chain.map((h) => h.status).filter((s) => s >= 300 && s < 400);
    const has301 = statuses.includes(301) || statuses.includes(308);
    const has302 = statuses.includes(302) || statuses.includes(307);
    if (has301 && has302) issueSet.add('MIXED_301_302');

    const last = chain[chain.length - 1];
    if (last) {
        if (last.status === 404) issueSet.add('ENDS_IN_404');
        else if (last.status >= 500) issueSet.add('ENDS_IN_5XX');
        else if (last.status >= 400) issueSet.add('ENDS_IN_NON_2XX');
    }

    const finalIssues = Array.from(issueSet);
    const summary = finalIssues.length === 0 ? 'OK' : finalIssues.join(' + ');
    const suggestedFix = buildFixSuggestion(finalIssues, chain);

    return {
        inputUrl,
        finalUrl: last?.url || null,
        finalStatus: last?.status ?? null,
        hopCount: redirectHops,
        chain,
        issues: finalIssues,
        summary,
        suggestedFix,
    };
}

function buildFixSuggestion(issues: Issue[], chain: Hop[]): string {
    if (issues.length === 0) return 'No action required.';
    const tips: string[] = [];

    if (issues.includes('CHAIN_TOO_LONG')) {
        const start = chain[0]?.url;
        const last = chain[chain.length - 1];
        const finalDest = last?.status && last.status < 300 ? last.url : last?.url;
        tips.push(
            `Collapse the chain to a single 301: ${start} → ${finalDest}. Add a single rule in next.config.ts that points the original source straight at the final destination.`
        );
    }
    if (issues.includes('LOOP')) {
        tips.push(
            'Remove the redirect rule that creates the cycle. Often caused by middleware redirecting to a path that itself redirects back. Add a guard: if request.nextUrl.pathname === target, do not redirect.'
        );
    }
    if (issues.includes('ENDS_IN_404')) {
        tips.push('Either repoint the redirect to a real page, or remove the redirect and let the URL 404 cleanly. Do not redirect to nonexistent destinations.');
    }
    if (issues.includes('MIXED_HTTP_HTTPS')) {
        tips.push('Force HTTPS at the platform level (Vercel does this automatically when the domain is attached). Remove any explicit http→https rule if Vercel is already handling it, to avoid double hops.');
    }
    if (issues.includes('WWW_INCONSISTENCY')) {
        tips.push(`Enforce a single canonical host (${CANONICAL_HOST}) via a host-based redirect in next.config.ts. Make sure no other rule strips or adds the www after this redirect.`);
    }
    if (issues.includes('MIXED_301_302')) {
        tips.push('Use 301 (permanent) consistently for moved pages. 302 should only be used for genuinely temporary redirects.');
    }
    if (issues.includes('EMPTY_LOCATION')) {
        tips.push('A 3xx response with no Location header is a server bug — likely the source of the "Redirect error" status in Search Console. Find the rule emitting an empty redirect (often a middleware path with an undefined target).');
    }
    if (issues.includes('MAX_HOPS_EXCEEDED')) {
        tips.push('Chain exceeded 10 hops — likely an unbroken loop. Inspect every rule in next.config.ts and middleware.js touching this path.');
    }
    if (issues.includes('NETWORK_ERROR')) {
        tips.push('Could not connect — check the URL is reachable and DNS is resolved.');
    }
    return tips.join(' ');
}

async function main() {
    if (INPUT_URLS.length === 0) {
        console.error(
            'No URLs to audit. Open scripts/auditRedirects.ts and paste URLs from Search Console CSV into INPUT_URLS.'
        );
        process.exit(1);
    }

    const results: AuditEntry[] = [];
    for (const url of INPUT_URLS) {
        process.stdout.write(`Auditing ${url} ...\n`);
        const { chain, issues } = await followChain(url);
        const entry = classify({ chain, issues, inputUrl: url });
        results.push(entry);

        const chainStr = entry.chain
            .map((h, i) =>
                i === entry.chain.length - 1
                    ? `${h.status}`
                    : `${h.status} → ${h.location || '(no location)'}`
            )
            .join(' → ');

        console.log(`URL: ${entry.inputUrl}`);
        console.log(`Chain: ${chainStr}`);
        console.log(`Issue: ${entry.summary}`);
        console.log(`Fix:   ${entry.suggestedFix}`);
        console.log('');
    }

    const outDir = path.join(process.cwd(), 'scripts', 'output');
    fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, 'redirect-audit.json');
    fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
    console.log(`Report saved to ${outPath}`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
