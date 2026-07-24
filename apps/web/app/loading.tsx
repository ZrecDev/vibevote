import { AppShell } from '@/components/app-shell';
import { RoomState } from '@/features/room/room-screens';
export default function Loading() { return <AppShell><RoomState kind="loading" /></AppShell>; }
