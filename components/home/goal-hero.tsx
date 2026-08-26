import Link from "next/link";

/**
 * Homepage hero – faithful refactor of the iHerb capture (5-tile mosaic).
 * - 1 large “Biggest Sale” tile (dark green + gold balloons) left
 * - 2×2 small tiles right (Daily Flash, Promise, Stock-Up, Makeup)
 * - Personalized bar below
 * - Quality Promise strip below that
 *
 * Uses own assets (Unsplash, inline SVG) but preserves layout, spacing,
 * typography scale, rounded corners and visual hierarchy of the reference.
 */
export function GoalHero() {
  return (
    <section className="shell pt-4">
      {/* ── Mosaic ── */}
      <div className="grid gap-3 lg:grid-cols-[1.58fr_1fr]">
        {/* Big sale tile */}
        <Link
          href="/deals"
          className="group relative flex min-h-[360px] flex-col items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#0f5c2e] via-[#0e4d27] to-[#082d1a] px-6 py-8 text-center sm:min-h-[400px] sm:px-8"
        >
          {/* subtle vignette */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.12),transparent_60%)]" />
          {/* confetti dots */}
          <div className="pointer-events-none absolute inset-0">
            <span className="absolute left-[18%] top-[18%] h-1.5 w-1.5 rounded-full bg-[#fde68a]/70" />
            <span className="absolute left-[32%] top-[12%] h-1 w-1 rounded-full bg-[#fde68a]/60" />
            <span className="absolute right-[28%] top-[16%] h-1.5 w-1.5 rounded-full bg-[#fde68a]/70" />
            <span className="absolute right-[18%] top-[24%] h-1 w-1 rounded-full bg-[#fde68a]/60" />
            <span className="absolute left-[24%] top-[42%] h-1 w-1 rounded-full bg-[#fde68a]/50" />
            <span className="absolute right-[22%] top-[38%] h-1 w-1 rounded-full bg-[#fde68a]/50" />
          </div>

          {/* balloons – left cluster */}
          <div className="pointer-events-none absolute -left-2 top-0 hidden select-none sm:flex">
            <div className="relative">
              <div className="h-[88px] w-[62px] rounded-full bg-gradient-to-br from-[#f9d976] via-[#d4a017] to-[#8c6b0a] shadow-lg" style={{ borderRadius: "50% 50% 50% 50% / 58% 58% 42% 42%" }} />
              <div className="absolute -bottom-3 left-1/2 h-8 w-px -translate-x-1/2 bg-gradient-to-b from-[#d4a017] to-transparent" />
              <div className="absolute left-[62px] top-3 h-[76px] w-[54px] rounded-full bg-gradient-to-br from-[#1a3d2e] to-[#0f2a1c] shadow-md" style={{ borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%" }} />
              <div className="absolute left-[48px] top-1 h-[70px] w-[52px] rounded-full bg-gradient-to-br from-[#0f4d2e] to-[#0a2e1a] opacity-90 shadow-md" style={{ borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%" }} />
            </div>
          </div>
          {/* balloons – right cluster */}
          <div className="pointer-events-none absolute -right-2 top-0 hidden select-none sm:flex">
            <div className="relative">
              <div className="h-[86px] w-[60px] rounded-full bg-gradient-to-br from-[#c9a86a] via-[#b8934f] to-[#8c6b2a] shadow-lg" style={{ borderRadius: "50% 50% 50% 50% / 58% 58% 42% 42%" }} />
              <div className="absolute right-[52px] top-2 h-[74px] w-[52px] rounded-full bg-gradient-to-br from-[#f9d976] via-[#d4a017] to-[#8c6b0a] shadow-md" style={{ borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%" }} />
              <div className="absolute right-[88px] top-3 h-[68px] w-[48px] rounded-full bg-gradient-to-br from-[#1a4a3a] to-[#0f2e1f] opacity-90 shadow-md" style={{ borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%" }} />
              <div className="absolute bottom-1 right-6 h-7 w-px bg-gradient-to-b from-[#b8934f] to-transparent" />
            </div>
          </div>
          {/* ribbons */}
          <div className="pointer-events-none absolute left-4 top-[78px] hidden h-16 w-px rotate-[18deg] bg-gradient-to-b from-[#d4a017]/80 to-transparent sm:block" />
          <div className="pointer-events-none absolute right-10 top-[76px] hidden h-14 w-px -rotate-[14deg] bg-gradient-to-b from-[#c9a86a]/80 to-transparent sm:block" />

          <div className="relative">
            <span className="inline-flex rounded-full bg-[#fde9a8] px-5 py-1.5 text-[13px] font-extrabold tracking-tight text-[#1a1a1a] shadow sm:text-[15px]">
              Biggest Sale of the Year!
            </span>
            <h1 className="mt-4 text-[30px] font-extrabold leading-[0.95] tracking-tight text-white sm:text-[40px] lg:text-[44px]">
              Up to 30% Off
              <span className="mt-1 block">~20,000 Products</span>
            </h1>
            <p className="mt-3 text-[20px] font-bold tracking-tight text-white sm:text-[26px]">+5% credit back</p>
            <span className="mt-5 inline-flex rounded-full bg-white px-6 py-2.5 text-[13px] font-semibold text-[#1a1a1a] shadow transition group-hover:bg-gray-50">
              Shop Now
            </span>
          </div>
        </Link>

        {/* Right 2×2 */}
        <div className="grid grid-cols-2 gap-3">
          {/* Daily Flash Deals – peach */}
          <Link
            href="/deals"
            className="group relative flex min-h-[190px] flex-col overflow-hidden rounded-xl bg-[#ffe9cc] p-4"
          >
            <div className="relative z-10 max-w-[62%]">
              <h3 className="text-[13px] font-bold leading-tight text-[#1a1a1a] sm:text-[14px]">Daily Flash Deals</h3>
              <p className="mt-1 text-[12px] leading-snug text-[#4b3a2a]">Save 40%+ off daily on hundreds of products</p>
            </div>
            <img
              src="https://images.unsplash.com/photo-1579762593131-b8945254345f?q=80&w=500&auto=format&fit=crop"
              alt=""
              width={160}
              height={160}
              className="pointer-events-none absolute bottom-0 right-0 h-[112px] w-[110px] select-none object-contain object-bottom transition-transform duration-300 group-hover:scale-[1.02]"
              loading="lazy"
            />
            {/* alarm visual fallback – red clock */}
            <div className="pointer-events-none absolute bottom-1 right-2 flex h-[92px] w-[88px] items-end justify-center">
              <div className="relative h-[72px] w-[72px] rounded-full border-[3px] border-[#d63a2b] bg-white shadow">
                <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1a1a1a]" />
                <div className="absolute left-1/2 top-1/2 h-[22px] w-[2px] -translate-x-1/2 -translate-y-full origin-bottom rotate-[18deg] bg-[#1a1a1a]" />
                <div className="absolute left-1/2 top-1/2 h-[18px] w-[2px] -translate-x-1/2 -translate-y-full origin-bottom rotate-[88deg] bg-[#1a1a1a]" />
                <div className="absolute -top-2 left-1/2 h-3 w-6 -translate-x-1/2 rounded-t-full border-2 border-[#d63a2b] bg-transparent" />
                <div className="absolute -top-1 left-2 h-2 w-2 rounded-full bg-[#d63a2b]" />
                <div className="absolute -top-1 right-2 h-2 w-2 rounded-full bg-[#d63a2b]" />
              </div>
              {/* hand */}
              <div className="absolute -top-3 right-1 h-10 w-14 rotate-[18deg] rounded-full bg-[#f5d0b8] opacity-90 blur-[0.2px]" />
            </div>
          </Link>

          {/* Our Promise – photo */}
          <Link href="/guides" className="group relative flex min-h-[190px] flex-col overflow-hidden rounded-xl bg-white p-4 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)]">
            <div className="relative z-10 max-w-[58%]">
              <h3 className="text-[13px] font-bold leading-tight text-[#1a1a1a] sm:text-[14px]">Our Promise of Quality</h3>
              <p className="mt-1 text-[12px] leading-snug text-[#4a4a4a]">Authentic products, standards you can trust</p>
            </div>
            <img
              src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=500&auto=format&fit=crop"
              alt=""
              width={220}
              height={180}
              className="absolute bottom-0 right-0 h-full w-[54%] object-cover object-top"
              loading="lazy"
            />
            <span className="pointer-events-none absolute bottom-2 right-2 rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-[#2e7d32] shadow">iHerb</span>
          </Link>

          {/* Stock-Up – photo */}
          <Link href="/c/vitamins" className="group relative flex min-h-[190px] flex-col overflow-hidden rounded-xl bg-white p-4 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)]">
            <div className="relative z-10 max-w-[60%]">
              <h3 className="text-[13px] font-bold leading-tight text-[#1a1a1a] sm:text-[14px]">Stock-Up Savings on Vitamins</h3>
              <p className="mt-1 text-[12px] leading-snug text-[#4a4a4a]">Amazing prices on everyday essentials</p>
            </div>
            <img
              src="https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?q=80&w=500&auto=format&fit=crop"
              alt=""
              width={220}
              height={180}
              className="absolute bottom-0 right-0 h-full w-[54%] object-cover object-center"
              loading="lazy"
            />
          </Link>

          {/* Makeup – lavender */}
          <Link href="/c/beauty" className="group relative flex min-h-[190px] flex-col overflow-hidden rounded-xl bg-[#ede4f7] p-4">
            <div className="relative z-10 max-w-[58%]">
              <h3 className="text-[13px] font-bold leading-tight text-[#1a1a1a] sm:text-[14px]">Makeup Must-Haves on Sale</h3>
              <p className="mt-1 text-[12px] leading-snug text-[#4a3a5a]">Save on color, complexion &amp; more</p>
            </div>
            <img
              src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=500&auto=format&fit=crop"
              alt=""
              width={220}
              height={180}
              className="absolute bottom-0 right-0 h-full w-[54%] object-cover object-top"
              loading="lazy"
            />
          </Link>
        </div>
      </div>

      {/* Personalized bar */}
      <div className="mt-3 flex flex-col items-start gap-3 rounded-lg bg-[#f3f3f3] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] font-medium text-[#1a1a1a]">Get a more personalized iHerb</p>
        <Link
          href="/#"
          className="inline-flex shrink-0 items-center justify-center rounded-md bg-[#2e7d32] px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#276a2b]"
        >
          Sign In or Create Account
        </Link>
      </div>

      {/* Quality Promise strip */}
      <div className="mt-3 rounded-xl bg-[#e7f0e7] px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 lg:max-w-[220px]">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2e7d32] text-white">
                <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <path d="M10 2.5 15.5 4.8v4.3c0 3.2-1.9 5.6-5.5 7-3.6-1.4-5.5-3.8-5.5-7V4.8L10 2.5Z" strokeLinejoin="round" />
                  <path d="m7 10 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <h2 className="text-[15px] font-bold tracking-tight text-[#1a1a1a]">iHerb Quality Promise</h2>
            </div>
            <p className="mt-1.5 text-[12px] leading-snug text-[#3a4a3a]">
              Quality you can trust, backed by how we source, verify, and store. <Link href="/guides" className="font-medium text-[#1d5bbf] hover:underline">Learn more</Link>
            </p>
          </div>

          <ul className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Authentic products", icon: Shield },
              { label: "Tested ingredients", icon: Flask },
              { label: "Preserved freshness", icon: Leaf },
              { label: "Easy returns and refunds", icon: Box },
            ].map(({ label, icon: Icon }) => (
              <li key={label} className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e7f0e7] text-[#2e7d32]">
                  <Icon />
                </span>
                <span className="text-[13px] font-medium leading-tight text-[#1a1a1a]">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Shield() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M12 3.5 17.5 6v4.5c0 3.4-2 6-5.5 7.5C8.5 16.5 6.5 13.9 6.5 10.5V6L12 3.5Z" strokeLinejoin="round" />
      <path d="M8.5 11.5 11 14l4.5-4.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function Flask() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.7}>
      <path d="M9 3h6v5l3.5 7.5a2.2 2.2 0 0 1-2 3.5H7.5a2.2 2.2 0 0 1-2-3.5L9 8V3Z" />
      <path d="M8 13h8" strokeLinecap="round" />
      <path d="M10 9h4" strokeLinecap="round" opacity={0.9} />
    </svg>
  );
}
function Leaf() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.7}>
      <path d="M12 20c-4.5 0-8-3.2-8-7.5 0-3 1.8-5.6 4.5-6.9 2.6 1.3 4.5 3.9 4.5 6.9 0 4.3-3.5 7.5-8 7.5Z" opacity={0.95} />
      <path d="M12 20c4.5 0 8-3.2 8-7.5 0-3-1.8-5.6-4.5-6.9" />
      <path d="M12 20V9" strokeLinecap="round" />
    </svg>
  );
}
function Box() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.7}>
      <path d="M3.5 9.5 12 5l8.5 4.5L12 14 3.5 9.5Z" strokeLinejoin="round" />
      <path d="M3.5 9.5v7L12 21l8.5-4.5v-7" strokeLinejoin="round" />
      <path d="M12 14v7" strokeLinecap="round" />
      <path d="M9 11.5 12 13l3-1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
