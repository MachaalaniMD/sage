import intensityData from '../data/statin-intensities.json';
import type { Recommendation } from './guidelines';
export const statinIntensities=intensityData;
export const hasStatinReference=(r:Recommendation)=>/\bstatin(?:s)?\b/i.test(`${r.title} ${r.summary}`);
export function mentionedStatinIntensity(r:Recommendation):'high'|'moderate'|'multiple'{
 const text=`${r.title} ${r.summary}`.toLowerCase();
 if(text.includes('maximally tolerated')||text.includes('high-intensity')&&text.includes('moderate-intensity'))return 'multiple';
 if(text.includes('high-intensity'))return 'high';
 if(text.includes('moderate-intensity'))return 'moderate';
 return 'multiple';
}
