# The Catalogue is the home page; Landing Pages own the indexable URLs

ImprovDB is a reference site: visitors arrive to find a game, so the Catalogue lives at `/` (and `/resource/browse` 301s there) rather than behind a marketing home page, letting the highest-authority URL rank for "improv games". Beyond `/`, only Landing Pages are meant to rank: the three types at keyword-matching top-level paths (`/exercises`, `/short-form-games`, `/long-form-formats`) and categories at `/category/[id]`. Any other filtered view is a query-param URL (`/?type=…&category=…`) whose canonical points to the matching Landing Page when it is exactly one type or one category, and to `/` otherwise.

## Considered Options

- **Type × category pages** (`/short-form-games/listening`): rejected; with ~100 Resources most combinations hold 1–3 items, which is thin content.
- **Configuration pages** (pairs, circle…): deferred; low search demand. Can be added without changing this scheme.
- **Redirecting single-filter views to their Landing Page**: rejected as extra navigation logic for little gain; the canonical tag captures most of the benefit.
- **Nested type paths** (`/games/short-form`, `/type/[type]`): rejected; top-level slugs match search phrases and there are only three.

## Consequences

- Category Landing Pages with fewer than 3 published Resources are `noindex` and left out of the sitemap.
- Changing these paths later needs permanent redirects to keep search ranking.
