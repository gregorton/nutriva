import { configuredProviders, type ProviderId } from "@/lib/oauth";
import { FacebookGlyph, GoogleGlyph } from "@/components/ui/icons";

/*
  "Sign in with Google" and friends, under the "or" on the first screen of the flow.

  One label rather than a sign-in and a sign-up wording, because the screen these sit on is both:
  a provider account we have not seen before creates one, and the button cannot know which it will
  be until the provider answers.

  A server component, and plain links rather than buttons: starting the flow is a GET to
  /api/auth/<provider>, and the whole exchange is redirects. No client JavaScript is involved on
  this side of it at all.

  Only providers whose credentials are actually set appear. A button that leads to a broken
  consent screen is worse than no button, and it means the same code runs whether or not the
  environment has been configured yet.
*/

const GLYPHS: Record<ProviderId, React.ComponentType<{ className?: string }>> = {
  google: GoogleGlyph,
  facebook: FacebookGlyph,
};

export function OAuthButtons({ next }: { next: string }) {
  const providers = configuredProviders();
  if (providers.length === 0) return null;

  return (
    <div className="mt-6">
      {/* A rule with the word sitting in it, rather than a heading: this is a divider, not a
          section. */}
      <div className="flex items-center gap-3" aria-hidden>
        <span className="h-px flex-1 bg-line" />
        <span className="kicker text-faint">or</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="mt-4 space-y-2.5">
        {providers.map(({ id, label }) => {
          const Glyph = GLYPHS[id];
          return (
            <a
              key={id}
              href={`/api/auth/${id}?next=${encodeURIComponent(next)}`}
              className="flex h-12 w-full items-center justify-center gap-2.5 rounded-card border border-line-strong bg-white text-[15px] font-medium text-ink transition-colors hover:border-plum-600 hover:bg-plum-100"
            >
              <Glyph className="h-[19px] w-[19px]" />
              Sign in with {label}
            </a>
          );
        })}
      </div>

      <p className="facts mt-3.5 text-center">
        We receive your name and email address, and nothing else.
      </p>
    </div>
  );
}
