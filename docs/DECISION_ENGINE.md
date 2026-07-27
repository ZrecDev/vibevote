# Decision Engine

Status: v1 algorithms are enforced in server-only database finalization RPCs.

Input is session mode, eligible options, participants, private vote values, vetoes, constraints, and a server-side selection seed. Remove hard-constraint failures, then valid vetoes, then calculate aggregate measures. Instant Match selects from universally accepted options; Best Fit ranks aggregate scores; Chaos selects from eligible group-accepted options. Equal candidates use the private seed. One immutable final result stores the winner, method, and readable fairness explanation in one transaction.

Required invariants: eligible participants only; no duplicate votes; veto allowance enforced; a vetoed or constrained-out option cannot win; Chaos selects only eligible group-accepted options; client cannot set winner; replay returns the same result; concurrent finalization creates one immutable result; public clients receive aggregates/explanations, never raw other-participant votes.
