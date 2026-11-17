import { ArrowUpRight } from 'lucide-react';

export function AboutSage() {
  return <div className="about-block about-sage">
    <p>Sage compares a patient's numbers and current medications against published guidelines and lists what to change, start, check or offer, with the source behind each item.</p>
    <p><strong>West Haven VA mode</strong> puts VA/DoD guidance first, lists other societies under each item, and shows VA national formulary status for suggested drugs. National status is not local stock or approval.</p>
    <p>Decision support for clinician use: verify against the linked source. Nothing is stored or sent anywhere; inputs clear on reload. Avoid entering patient identifiers.</p>
    <div className="about-creator"><span>Created by</span><strong>Marc Machaalani</strong><a href="https://marcmachaalani.github.io" target="_blank" rel="noreferrer">marcmachaalani.github.io <ArrowUpRight size={14}/></a></div>
  </div>;
}
