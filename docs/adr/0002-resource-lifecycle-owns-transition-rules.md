# The Resource lifecycle module decides who may change a Resource

Every write that moves a Resource between Draft, Published and Edit Proposal, or changes one (create, save, Accept, Reject, publish, unpublish, delete), goes through one module that knows both the legal transitions and who may perform them. Its tRPC procedures are therefore all `privateProcedure` thin adapters rather than `adminProcedure`: whether a signed-in user may perform a transition depends on the Resource's state as well as their role (saving an edit is a direct edit for an admin, an Edit Proposal for anyone else, and Accept when an admin saves an Edit Proposal), so a procedure type alone cannot express the rule, and splitting it between the two would put it back in two places.

## Consequences

- Don't "fix" Resource procedures back to `adminProcedure`; add or change the rule in the lifecycle module.
- Who can *see* a Resource is a separate concern, decided in `src/lib/access.ts`.
- Request throttling stays in the procedures; it is not a lifecycle rule.
