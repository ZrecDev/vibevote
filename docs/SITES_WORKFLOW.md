# Sites Workflow

Sites is for mobile UX exploration, clickable prototypes, user testing, visual direction, and landing-page experimentation. It is not the source of truth for database architecture, authentication, vote calculation, security, payments, or production server behavior.

The Experience Lead should prototype realistic flows and error/recovery states, test with groups, record confusion/trust/time-to-result, gain approval, then translate the approved structure and visual tokens into `apps/web` and reusable primitives in `packages/ui`. Keep production behavior constrained by the merged contracts and mock adapter; do not copy Sites data behavior into production code.
