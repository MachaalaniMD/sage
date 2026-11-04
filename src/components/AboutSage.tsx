import { ArrowUpRight } from 'lucide-react';

export function AboutSage() {
  return <div className="about-block about-sage">
    <p>Sage brings clinical recommendations, their evidence and their sources into one place. It has three parts: a decision engine for example cases, a guideline library for quick reference, and risk calculators linked to relevant guidance.</p>
    <p>It is built for practical questions that come up in primary care, including work in the VA. Different societies sometimes recommend different approaches. Sage keeps the society, date, population and original evidence grade visible so those differences can be understood.</p>
    <div className="about-creator"><span>Created by</span><strong>Marc Machaalani</strong><a href="https://marcmachaalani.github.io" target="_blank" rel="noreferrer">marcmachaalani.github.io <ArrowUpRight size={14}/></a></div>
    <h3>Sources and scope</h3>
    <p>Sage is an independent prototype. A dated source check means a publication was reviewed for this catalog; it does not guarantee complete coverage or validate a clinical decision. Drafts and access limits are identified, and source changes go to a review queue.</p>
    <h3>Privacy</h3>
    <p>No patient information should be entered. Case values, searches and saved references stay in memory and clear on reload. There are no accounts or analytics, and case values are never included in requests or URLs. External source links open separately; hosting providers may keep ordinary connection logs.</p>
    <p className="source-disclaimer">Sage is not affiliated with or endorsed by the VA or the societies it cites.</p>
  </div>;
}
