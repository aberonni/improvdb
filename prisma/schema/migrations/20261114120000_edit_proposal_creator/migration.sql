-- An Edit Proposal's creator is its proposer (since #274, for new ones). Older
-- Edit Proposals recorded the original Resource's creator instead.
UPDATE "Resource"
SET "createdById" = "editProposalAuthorId"
WHERE "editProposalOriginalResourceId" IS NOT NULL
  AND "editProposalAuthorId" IS NOT NULL
  AND "createdById" <> "editProposalAuthorId";
