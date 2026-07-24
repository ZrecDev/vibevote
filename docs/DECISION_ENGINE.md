# Decision Engine

Status: interfaces and vocabulary exist; algorithms are deliberately unimplemented.

Input is session mode, eligible options, participants, private vote values, vetoes, constraints, and a server-side RNG seed. Remove hard-constraint failures, then valid vetoes, then calculate aggregate measures. Apply the selected mode; only break a deterministic tie with the seed. Persist winner, runner-up when applicable, score breakdown, method, and a readable fairness receipt in one finalization transaction.

Required invariants: eligible participants only; no duplicate votes; veto allowance enforced; a vetoed or constrained-out option cannot win; Chaos selects only eligible group-accepted options; client cannot set winner; replay returns the same result; concurrent finalization creates one immutable result; public clients receive aggregates/explanations, never raw other-participant votes.
