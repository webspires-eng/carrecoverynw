export type SubAreaItem = { name: string; slug: string | null };

export type BuildSubAreasResult = {
  linked: number;
  total: number;
  html: SubAreaItem[];
};

const PREFIXES_TO_STRIP = [
  "london-borough-of-",
  "royal-borough-of-",
  "city-of-",
];

function baseNormalise(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function variants(slug: string): string[] {
  const out = new Set<string>();
  out.add(slug);

  if (/(^|-)st-/.test(slug)) {
    out.add(slug.replace(/(^|-)st-/g, "$1saint-"));
  }
  if (/(^|-)saint-/.test(slug)) {
    out.add(slug.replace(/(^|-)saint-/g, "$1st-"));
  }

  for (const prefix of PREFIXES_TO_STRIP) {
    if (slug.startsWith(prefix)) {
      out.add(slug.slice(prefix.length));
    }
  }

  if (slug.includes("-and-")) {
    out.add(slug.replace(/-and-/g, "-"));
  }

  return Array.from(out).filter(Boolean);
}

export function matchNameToSlug(
  name: string,
  allSlugs: string[]
): string | null {
  if (!name) return null;
  const slugSet = new Set(allSlugs);

  const normalised = baseNormalise(name);
  if (!normalised) return null;

  for (const candidate of variants(normalised)) {
    if (slugSet.has(candidate)) return candidate;
  }

  return null;
}

function parseSubAreas(input: string | string[] | null | undefined): string[] {
  if (!input) return [];
  const arr = Array.isArray(input)
    ? input
    : input.split(/[\n,]+/);
  return arr
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter((s) => s.length > 0);
}

export function buildSubAreasHTML(
  subAreasText: string | string[],
  allSlugs: string[],
  currentSlug: string
): BuildSubAreasResult {
  const names = parseSubAreas(subAreasText);
  const seen = new Set<string>();
  const items: SubAreaItem[] = [];
  let linked = 0;

  for (const name of names) {
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const slug = matchNameToSlug(name, allSlugs);
    const finalSlug = slug && slug !== currentSlug ? slug : null;
    if (finalSlug) linked += 1;
    items.push({ name, slug: finalSlug });
  }

  return { linked, total: items.length, html: items };
}
