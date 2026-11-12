import { LessonPlanVisibility, UserRole } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  canEditLessonPlan,
  canViewLessonPlan,
  canViewResource,
  isAdmin,
  visibleResourcesWhere,
} from "@/lib/access";

const user = { id: "user", role: UserRole.USER };
const other = { id: "other", role: UserRole.USER };
const admin = { id: "admin", role: UserRole.ADMIN };

const published = {
  published: true,
  createdById: "other",
  editProposalAuthorId: null,
};
const proposal = { ...published, published: false, createdById: "user" };
const editProposal = {
  published: false,
  createdById: "other",
  editProposalAuthorId: "user",
};

describe("isAdmin", () => {
  it("is true only for the admin role", () => {
    expect(isAdmin(admin)).toBe(true);
    expect(isAdmin(user)).toBe(false);
    expect(isAdmin(null)).toBe(false);
  });
});

describe("canViewResource", () => {
  it("lets everybody see published Resources", () => {
    expect(canViewResource(null, published)).toBe(true);
    expect(canViewResource(user, published)).toBe(true);
  });

  it("lets only the proposer and admins see a Proposal", () => {
    expect(canViewResource(user, proposal)).toBe(true);
    expect(canViewResource(admin, proposal)).toBe(true);
    expect(canViewResource(other, proposal)).toBe(false);
    expect(canViewResource(null, proposal)).toBe(false);
  });

  it("lets the author of an Edit Proposal see it", () => {
    expect(canViewResource(user, editProposal)).toBe(true);
    expect(canViewResource({ id: "third", role: UserRole.USER }, editProposal))
      .toBe(false);
  });
});

describe("visibleResourcesWhere", () => {
  it("is published Resources only when signed out", () => {
    expect(visibleResourcesWhere(null)).toEqual({ published: true });
  });

  it("adds the viewer's own Proposals and Edit Proposals", () => {
    expect(visibleResourcesWhere(user)).toEqual({
      OR: [
        { published: true },
        { createdById: "user" },
        { editProposalAuthorId: "user" },
      ],
    });
  });

  it("does not filter for admins", () => {
    expect(visibleResourcesWhere(admin)).toEqual({});
  });
});

describe("Lesson Plans", () => {
  const privatePlan = {
    visibility: LessonPlanVisibility.PRIVATE,
    createdById: "user",
  };
  const publicPlan = { ...privatePlan, visibility: LessonPlanVisibility.PUBLIC };

  it("shows public plans to everybody and private ones to their creator and admins", () => {
    expect(canViewLessonPlan(null, publicPlan)).toBe(true);
    expect(canViewLessonPlan(user, privatePlan)).toBe(true);
    expect(canViewLessonPlan(admin, privatePlan)).toBe(true);
    expect(canViewLessonPlan(other, privatePlan)).toBe(false);
    expect(canViewLessonPlan(null, privatePlan)).toBe(false);
  });

  it("lets only the creator edit, not even admins", () => {
    expect(canEditLessonPlan(user, publicPlan)).toBe(true);
    expect(canEditLessonPlan(other, publicPlan)).toBe(false);
    expect(canEditLessonPlan(admin, publicPlan)).toBe(false);
    expect(canEditLessonPlan(null, publicPlan)).toBe(false);
  });
});
