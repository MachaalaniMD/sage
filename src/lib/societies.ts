import data from '../data/society-review.json';
import type { Source } from './guidelines';

export const societyReview = data;
export const societyReviewDate = '2026-11-03';
// Whole-name matching avoids confusing ACP with ACCP, ACR with an unrelated acronym,
// or ASH with ASHP. Joint documents remain discoverable under each named society.
const aliases: Record<string, string[]> = {
  'CDC/ACIP': ['CDC', 'ACIP'], 'CDC / ACIP': ['CDC', 'ACIP'],
  'Endocrine Society': ['Endocrine Society'],
};
export function sourceMatchesSociety(source: Pick<Source, 'society'>, society: string): boolean {
  const terms = aliases[society] || [society];
  return terms.some(term => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^a-z])${escaped}([^a-z]|$)`, 'i').test(source.society);
  });
}
export const societyFilters = [
  ...societyReview.map(s => ({ value: s.acronym, label: s.acronym })),
  ...['VA', 'BHOF', 'ACS', 'USMSTF', 'ASCCP', 'ASAM', 'ASMBS', 'HHS'].map(value => ({ value, label: value === 'VA' ? 'VA / DoD' : value })),
];
