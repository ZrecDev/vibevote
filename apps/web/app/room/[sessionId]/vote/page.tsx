import { AppShell } from '@/components/app-shell';
import { PrivateBallot, VotingProgress } from '@/features/room/room-components';
export default function Page() { return <AppShell><PrivateBallot /><div style={{ marginTop: '1rem' }}><VotingProgress /></div></AppShell>; }
