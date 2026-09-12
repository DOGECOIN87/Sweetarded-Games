import { Link } from 'react-router-dom';
import SectionHeading from './SectionHeading';
import { ROADMAP, ROADMAP_DISCLAIMER, type RoadmapAccent } from '../content/roadmap';

/* ── What's cooking — three beats, no quarters, no over-promise ── */

const ACCENT: Record<
  RoadmapAccent,
  { text: string; border: string; chip: string; glow: string; bar: string }
> = {
  cerise: {
    text: 'text-sweetardios-cerise',
    border: 'hover:border-sweetardios-cerise/50',
    chip: 'border-sweetardios-cerise/50 bg-sweetardios-cerise/12 text-sweetardios-cerise',
    glow: 'sw-glow-cerise',
    bar: 'bg-sweetardios-cerise shadow-[0_0_10px_#F715AB]',
  },
  cyan: {
    text: 'text-sweetardios-cyan',
    border: 'hover:border-sweetardios-cyan/50',
    chip: 'border-sweetardios-cyan/50 bg-sweetardios-cyan/12 text-sweetardios-cyan',
    glow: 'sw-glow-cyan',
    bar: 'bg-sweetardios-cyan shadow-[0_0_10px_#34EDF3]',
  },
  violet: {
    text: 'text-sweetardios-violet',
    border: 'hover:border-sweetardios-violet/50',
    chip: 'border-sweetardios-violet/50 bg-sweetardios-violet/12 text-sweetardios-violet',
    glow: 'sw-glow-violet',
    bar: 'bg-sweetardios-violet shadow-[0_0_10px_#9201CB]',
  },
};

const Roadmap = () => (
  <section id="cooking" aria-label="What's cooking" className="relative mx-auto max-w-6xl px-6 py-20 sm:py-24">
    <SectionHeading
      eyebrow="What's cooking"
      title="The menu"
      sub="The shop is open. The drop is Sunday. After that, holders get the arcade — and we keep building machines."
      accent="cyan"
    />

    <ol className="grid grid-cols-1 gap-5 md:grid-cols-3">
      {ROADMAP.map((beat, i) => {
        const a = ACCENT[beat.accent];
        return (
          <li
            key={beat.id}
            className={`sw-lightbar sw-reveal group flex flex-col border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm transition-all hover:-translate-y-1 ${a.border}`}
            style={{ '--rv-i': i } as React.CSSProperties}
          >
            <div className="flex items-center gap-3">
              <span aria-hidden className={`h-1.5 w-1.5 ${a.bar}`} style={{ borderRadius: '9999px' }} />
              <span
                className={`border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.22em] ${a.chip}`}
              >
                {beat.status}
              </span>
            </div>
            <h3 className={`font-heading mt-5 text-2xl text-white sm:text-3xl ${a.glow}`}>{beat.title}</h3>
            <ul className="mt-6 flex flex-1 flex-col gap-4">
              {beat.items.map((item) => {
                const body = (
                  <>
                    <p className={`text-[11px] font-bold uppercase tracking-[0.18em] ${a.text}`}>{item.label}</p>
                    <p className="mt-1 text-sm leading-relaxed text-blue-100/65">{item.detail}</p>
                  </>
                );
                return (
                  <li key={item.label}>
                    {item.to ? (
                      <Link
                        to={item.to}
                        className="block transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sweetardios-cyan"
                      >
                        {body}
                        <span className={`mt-1 inline-block text-[11px] font-bold uppercase tracking-[0.16em] ${a.text}`}>
                          Open <span aria-hidden>→</span>
                        </span>
                      </Link>
                    ) : (
                      body
                    )}
                  </li>
                );
              })}
            </ul>
          </li>
        );
      })}
    </ol>

    <p className="mt-8 text-center text-[11px] leading-relaxed tracking-wide text-blue-100/40">{ROADMAP_DISCLAIMER}</p>
  </section>
);

export default Roadmap;
