export const ANALYTICS_DIMENSIONS = [
  "dataset",
  "canonicalWorkItemId",
  "priceSemantic",
  "standardUnit",
  "standardQuoteType",
  "scopeSignature",
  "unitCostBasis",
  "transportInclusion",
];

export const TYPED_QUERY_EXPANSIONS = new Map([
  ["鋁質方行扣板天花", "鋁質方形扣板天花"],
  ["鋁扣版天花", "鋁扣板天花"],
  ["aluminium celing tile", "aluminium ceiling tile"],
  ["alluminium ceiling", "aluminium ceiling"],
]);

export function normalizeSearchText(value) {
  return String(value ?? "")
    .toLocaleLowerCase("zh-Hant")
    .replace(/[×＊*]/g, "x")
    .replace(/[，、｜|/()（）·]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function expandTypedQuery(query, degraded = false) {
  const normalized = normalizeSearchText(query);
  if (degraded) return normalized;
  return TYPED_QUERY_EXPANSIONS.get(normalized) ?? normalized;
}

export function analyticsGroupKey(record) {
  return ANALYTICS_DIMENSIONS.map((dimension) => record[dimension]).join("|");
}

export function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const midpoint = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[midpoint]
    : (sorted[midpoint - 1] + sorted[midpoint]) / 2;
}

export function percentile(values, percentileValue) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * percentileValue;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

export function calculateGroupStatistics(records) {
  const values = records.map((record) => Number(record.mopValue));
  const count = values.length;
  const original = count === 1 ? values[0] : null;

  if (count === 1) {
    return {
      count,
      original,
      min: null,
      max: null,
      average: null,
      median: null,
      p25: null,
      p75: null,
    };
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return {
    count,
    original,
    min: Math.min(...values),
    max: Math.max(...values),
    average: total / count,
    median: median(values),
    p25: count >= 4 ? percentile(values, 0.25) : null,
    p75: count >= 4 ? percentile(values, 0.75) : null,
  };
}

export function groupSelectedRecords(records) {
  const map = new Map();
  records.forEach((record) => {
    const key = analyticsGroupKey(record);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(record);
  });

  return [...map.entries()].map(([key, groupedRecords], index) => ({
    id: `G${String(index + 1).padStart(3, "0")}`,
    key,
    records: groupedRecords,
    statistics: calculateGroupStatistics(groupedRecords),
  }));
}

export function searchRecord(record, query) {
  const normalized = normalizeSearchText(query);
  if (!normalized) return true;
  const haystack = [
    record.id,
    record.itemCode,
    record.rawDescription,
    record.canonicalDescription,
    record.canonicalTerm,
    record.counterparty,
    record.project,
    record.priceSemanticLabel,
    record.standardQuoteType,
    record.scopeLabel,
    ...(record.aliases ?? []),
  ]
    .join(" ");
  const normalizedHaystack = normalizeSearchText(haystack);
  return normalized
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => normalizedHaystack.includes(token));
}

export function rankSearchRecords(records, query, { degraded = false } = {}) {
  const expanded = expandTypedQuery(query, degraded);
  if (!expanded) return records.map((record) => ({ record, score: 0 }));
  const tokens = expanded.split(/\s+/).filter(Boolean);

  return records
    .map((record) => {
      const exactIdentifiers = [record.id, record.itemCode, record.dataset, record.canonicalWorkItemId].map(normalizeSearchText);
      const canonical = normalizeSearchText(`${record.canonicalTerm} ${record.canonicalDescription}`);
      const raw = normalizeSearchText(record.rawDescription);
      const aliases = normalizeSearchText((record.aliases ?? []).join(" "));
      const partyAndProject = normalizeSearchText(`${record.counterparty} ${record.project}`);
      const semantics = normalizeSearchText(`${record.priceSemanticLabel} ${record.standardQuoteType} ${record.scopeLabel}`);
      const searchable = [canonical, raw, aliases, partyAndProject, semantics, ...exactIdentifiers].join(" ");
      if (!tokens.every((token) => searchable.includes(token))) return null;

      let score = 20;
      if (exactIdentifiers.includes(expanded)) score += 100;
      if (canonical === expanded) score += 90;
      if (canonical.includes(expanded)) score += 70;
      if (raw.includes(expanded)) score += 55;
      if (aliases.includes(expanded)) score += 45;
      if (partyAndProject.includes(expanded)) score += 35;
      score += tokens.filter((token) => canonical.includes(token)).length * 8;
      score += tokens.filter((token) => raw.includes(token)).length * 5;
      return { record, score };
    })
    .filter(Boolean)
    .sort((left, right) => right.score - left.score || right.record.date.localeCompare(left.record.date));
}

export function formatMop(value) {
  if (value === null || value === undefined) return "–";
  return new Intl.NumberFormat("zh-HK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
