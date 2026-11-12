import {
  LessonPlanVisibility,
  type Prisma,
  type UserRole,
  UserRole as UserRoles,
} from "@prisma/client";

/**
 * Who may see or change a Resource or a Lesson Plan. Shared by the tRPC
 * routers (which enforce it) and the pages (which only hide what the server
 * would refuse), so both always agree.
 */

/** The signed-in user, or null/undefined when signed out */
export type Viewer = { id: string; role: UserRole } | null | undefined;

type ResourceAccessFields = {
  published: boolean;
  createdById: string;
  editProposalAuthorId: string | null;
};

type LessonPlanAccessFields = {
  visibility: LessonPlanVisibility;
  createdById: string;
};

export function isAdmin(viewer: Viewer): boolean {
  return viewer?.role === UserRoles.ADMIN;
}

/** Published Resources, the ones everybody can see */
export const publishedResourcesWhere = {
  published: true,
} as const satisfies Prisma.ResourceWhereInput;

/**
 * Published Resources, plus a viewer's own Proposals and Edit Proposals.
 * Admins see everything.
 */
export function canViewResource(
  viewer: Viewer,
  resource: ResourceAccessFields,
): boolean {
  return (
    resource.published ||
    isAdmin(viewer) ||
    (!!viewer &&
      (resource.createdById === viewer.id ||
        resource.editProposalAuthorId === viewer.id))
  );
}

/** The same rule as canViewResource, as a Prisma filter */
export function visibleResourcesWhere(
  viewer: Viewer,
): Prisma.ResourceWhereInput {
  if (isAdmin(viewer)) return {};
  if (!viewer) return publishedResourcesWhere;
  return {
    OR: [
      publishedResourcesWhere,
      { createdById: viewer.id },
      { editProposalAuthorId: viewer.id },
    ],
  };
}

/** Public Lesson Plans, plus a viewer's own. Admins see everything. */
export function canViewLessonPlan(
  viewer: Viewer,
  lessonPlan: LessonPlanAccessFields,
): boolean {
  return (
    lessonPlan.visibility === LessonPlanVisibility.PUBLIC ||
    isAdmin(viewer) ||
    canEditLessonPlan(viewer, lessonPlan)
  );
}

/** Only its creator may edit, delete or change the visibility of a Lesson Plan */
export function canEditLessonPlan(
  viewer: Viewer,
  lessonPlan: Pick<LessonPlanAccessFields, "createdById">,
): boolean {
  return !!viewer && lessonPlan.createdById === viewer.id;
}
