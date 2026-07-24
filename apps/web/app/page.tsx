import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { Button, Card } from '@/components/ui';

export default function HomePage() {
  return <AppShell><section className="page-intro"><p className="eyebrow">Private group decisions</p><h1>Stop debating.<br />Decide together.</h1><p className="lede">Create one room, share one link, and get to a plan without putting anyone’s preferences on display.</p><Link href="/create"><Button>Start a decision</Button></Link></section><Card><h2>How it works</h2><p className="muted">Add options, invite your people, vote privately, then see a group-ready plan and a backup.</p></Card></AppShell>;
}
