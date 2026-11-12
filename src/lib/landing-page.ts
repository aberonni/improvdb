import { type Prisma, ResourceType } from "@prisma/client";

import { publishedResourcesWhere } from "@/lib/access";
import { type CatalogueState, EMPTY_CATALOGUE_STATE } from "@/lib/catalogue";

/**
 * Landing Pages: Catalogue views fixed to one type or one Category, meant to
 * be found through search (see docs/adr/0001). This module decides
 * everything about them (path, copy, which Resources they list and whether
 * search engines should index them), so pages, navigation and the sitemap
 * only render what it returns.
 */

/** Which Resources a Landing Page lists, as passed to resource.getCatalogue */
export type LandingPageFilter = { type: ResourceType } | { category: string };

export type LandingPage = {
  path: string;
  /** Short name, used in breadcrumbs and navigation */
  name: string;
  /** <title>, without the site name */
  title: string;
  /** H1 */
  heading: string;
  /** Line under the heading, given how many Resources the page lists */
  subtitle: (count: number) => string;
  /** Meta description */
  description: string;
  intro: string[];
  filter: LandingPageFilter;
  /** The Catalogue's filters when the page opens */
  initialState: CatalogueState;
  indexable: boolean;
};

/** Category Landing Pages with fewer published Resources are not indexed. */
const MIN_RESOURCES_TO_INDEX = 3;
const MAX_DESCRIPTION_LENGTH = 300;

const TYPE_PAGES: Record<
  ResourceType,
  Pick<LandingPage, "path" | "name" | "heading" | "description" | "intro">
> = {
  EXERCISE: {
    path: "/exercises",
    name: "Exercises",
    heading: "Improv Exercises & Warm-ups",
    description:
      "Improv warm-ups and exercises for classes and rehearsals: listening, agreement, spontaneity and more, each with instructions and tips for teachers.",
    intro: [
      "Exercises are the backbone of any improv class. They warm a group up, build trust and train one skill at a time, from listening and agreement to spontaneity and commitment, without the pressure of performing for an audience.",
      "Every exercise here comes with instructions you can run straight away. Filter by category to find one that practises the skill your group needs today.",
    ],
  },
  SHORT_FORM: {
    path: "/short-form-games",
    name: "Short Form Games",
    heading: "Short Form Improv Games",
    description:
      "Short form improv games for classes, jams and shows: quick scene games with a simple rule or gimmick, each with instructions and tips.",
    intro: [
      "Short form games are quick, structured scenes built around a rule or gimmick: freeze a scene and replace a player, speak only in questions, or let the audience steer the story. They are the format behind most improv comedy shows and a great way into scenework.",
      "Use them in class to practise a specific skill, at a jam to get everyone on stage, or in a show to give the audience something to play along with.",
    ],
  },
  LONG_FORM: {
    path: "/long-form-formats",
    name: "Long Form Formats",
    heading: "Long Form Improv Formats",
    description:
      "Long form improv formats explained: the structure of extended improvised pieces like the Armando and La Ronde, with tips for teaching and performing them.",
    intro: [
      "Long form formats give an extended improvised piece its shape: how scenes connect, when themes return and how the whole thing builds to an ending. They turn a run of scenes into a show.",
      "Each format here describes its structure and how to rehearse it, whether you are teaching your first long form class or looking for something new to perform.",
    ],
  },
};

export function typeLandingPage(type: ResourceType): LandingPage {
  const page = TYPE_PAGES[type];
  return {
    ...page,
    title: page.heading,
    subtitle: (count) =>
      `${count} ${page.name.toLowerCase()}, free and open source`,
    filter: { type },
    initialState: { ...EMPTY_CATALOGUE_STATE, type: [type] },
    indexable: true,
  };
}

/** One Landing Page per type, in navigation order */
export const typeLandingPages = Object.values(ResourceType).map(
  typeLandingPage,
);

/** Prisma include/select that gives a Category what categoryLandingPage needs */
export const categoryLandingPageFields = {
  id: true,
  name: true,
  description: true,
  _count: {
    select: { resources: { where: { resource: publishedResourcesWhere } } },
  },
} as const satisfies Prisma.CategorySelect;

export type LandingPageCategory = Prisma.CategoryGetPayload<{
  select: typeof categoryLandingPageFields;
}>;

/** A link to a Category's Landing Page, when only its id is at hand */
export function categoryLandingPath(categoryId: string) {
  return `/category/${categoryId}`;
}

function paragraphs(text: string | null) {
  return (text ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function categoryLandingPage(category: LandingPageCategory): LandingPage {
  const skill = category.name.toLowerCase();
  const written = paragraphs(category.description);
  const intro = written.length
    ? written
    : [
        `Improv games and exercises for practising ${skill}. Filter them by type or group setup to find one for your next class or rehearsal.`,
      ];

  return {
    path: categoryLandingPath(category.id),
    name: category.name,
    title: `${category.name} Improv Games & Exercises`,
    heading: category.name,
    subtitle: (count) =>
      `${count} improv ${count === 1 ? "game or exercise" : "games and exercises"} for practising ${skill}`,
    description: intro[0]!.slice(0, MAX_DESCRIPTION_LENGTH),
    intro,
    filter: { category: category.id },
    initialState: { ...EMPTY_CATALOGUE_STATE, category: [category.id] },
    indexable: category._count.resources >= MIN_RESOURCES_TO_INDEX,
  };
}
