/**
 * Where a Resource is in its lifecycle (see GLOSSARY.md). Changes between
 * states go through src/server/resource-lifecycle; pages use this to show the
 * actions that apply.
 */
export const ResourceState = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  EDIT_PROPOSAL: "EDIT_PROPOSAL",
} as const;

export type ResourceState = (typeof ResourceState)[keyof typeof ResourceState];

export function stateOf(resource: {
  published: boolean;
  editProposalOriginalResourceId: string | null;
}): ResourceState {
  if (resource.editProposalOriginalResourceId) {
    return ResourceState.EDIT_PROPOSAL;
  }
  return resource.published ? ResourceState.PUBLISHED : ResourceState.DRAFT;
}
