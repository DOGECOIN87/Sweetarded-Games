import { useState } from 'react';
import SectionHeading from './SectionHeading';
import { SocialIcon } from './SocialIcon';
import { TEAM, type TeamMember } from '../content/team';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

/* ── Team card — circular avatar (image or looping video), name, bio ── */

const TeamCard = ({ member, i }: { member: TeamMember; i: number }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const accent = i % 2 === 0 ? 'cerise' : 'cyan';
  const grad =
    accent === 'cerise'
      ? 'from-sweetardios-cerise/70 via-sweetardios-violet/40 to-sweetardios-cyan/30'
      : 'from-sweetardios-cyan/70 via-sweetardios-violet/40 to-sweetardios-cerise/30';
  const accentText = accent === 'cerise' ? 'text-sweetardios-cerise' : 'text-sweetardios-cyan';
  const glow = accent === 'cerise' ? 'sw-glow-cerise' : 'sw-glow-cyan';

  return (
    <div
      className="sw-reveal group relative bg-gradient-to-br p-px transition-all duration-300 hover:-translate-y-1.5"
      style={{ '--rv-i': i } as React.CSSProperties}
    >
      <div className={`h-full bg-gradient-to-br ${grad} p-px`}>
        <div className="flex h-full flex-col items-center bg-[#080f33]/95 px-7 py-9 text-center backdrop-blur">
          {/* Circular avatar frame — border-radius is zeroed by the site's
              Tailwind theme (square diner aesthetic), so circles here use
              inline style rather than rounded-full. */}
          <div
            className={`relative bg-gradient-to-br ${grad} p-[3px] shadow-[0_10px_40px_-12px_rgba(0,0,0,0.8)]`}
            style={{ borderRadius: '9999px' }}
          >
            <div
              className="h-28 w-28 overflow-hidden bg-sweetardios-oxford sm:h-32 sm:w-32"
              style={{ borderRadius: '9999px' }}
            >
              {member.avatar.type === 'video' ? (
                <video
                  className="h-full w-full object-cover"
                  style={{ borderRadius: '9999px' }}
                  autoPlay
                  loop
                  muted
                  playsInline
                  aria-label={`${member.name} — animated avatar`}
                >
                  {member.avatar.sources.map((src) => (
                    <source key={src} src={src} type={src.endsWith('.webm') ? 'video/webm' : 'video/mp4'} />
                  ))}
                </video>
              ) : imgFailed ? (
                <div
                  className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${grad} font-heading text-3xl text-white/90`}
                  aria-label={member.role ? `${member.name} — ${member.role}` : member.name}
                >
                  {initials(member.name)}
                </div>
              ) : (
                <img
                  className="h-full w-full object-cover"
                  style={{ borderRadius: '9999px' }}
                  src={member.avatar.src}
                  alt={member.role ? `${member.name} — ${member.role}` : member.name}
                  loading="lazy"
                  decoding="async"
                  onError={() => setImgFailed(true)}
                />
              )}
            </div>
          </div>

          <h3 className={`font-heading mt-5 text-2xl text-white ${glow}`}>{member.name}</h3>
          {member.alias && (
            <p className={`mt-1 text-xs font-bold uppercase tracking-[0.2em] ${accentText}`}>
              a.k.a. “{member.alias}”
            </p>
          )}
          {member.role && (
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-100/45">
              {member.role}
            </p>
          )}

          {member.bio && (
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-blue-100/70">{member.bio}</p>
          )}

          {((member.links && member.links.length > 0) || member.discord) && (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              {member.links?.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-blue-100/75 transition-colors hover:border-sweetardios-cyan/50 hover:text-sweetardios-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sweetardios-cyan"
                >
                  {link.icon && <SocialIcon platform={link.icon} className="h-3.5 w-3.5" />}
                  {link.label} <span aria-hidden>↗</span>
                </a>
              ))}
              {member.discord && (
                <span
                  className="inline-flex items-center gap-2 border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-blue-100/75"
                  title="Discord"
                >
                  <SocialIcon platform="discord" className="h-3.5 w-3.5" /> {member.discord}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Team = () => (
  <section id="team" aria-label="The team" className="relative mx-auto max-w-6xl px-6 py-20 sm:py-24">
    <SectionHeading
      eyebrow="The Team"
      title="Who's behind the counter"
      sub="The people building the Sweetardio Collection and the arcade around it."
      accent="cerise"
    />

    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {TEAM.map((member, i) => (
        <TeamCard key={member.name} member={member} i={i} />
      ))}
    </div>
  </section>
);

export default Team;
