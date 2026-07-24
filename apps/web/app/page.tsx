import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { Button, Card } from '@/components/ui';

export default function HomePage() {
  return <AppShell><section className="hero-card card"><p className="eyebrow">Private group decisions</p><h1>Find a plan<br />that feels fair.</h1><p className="lede">Bring a few good options, let every person vote privately, and leave with a plan the group can live with.</p><div className="row"><Link href="/create"><Button>Start a decision</Button></Link><Link href="/room/550e8400-e29b-41d4-a716-446655440000"><Button variant="secondary">View a room</Button></Link></div></section><section className="stack" style={{ marginTop: '1rem' }}><Card><div className="section-heading"><div><p className="eyebrow">One calm flow</p><h2>Less debate. More dinner.</h2></div></div><div className="room-meta"><span>1 · Add options</span><span>2 · Invite everyone</span><span>3 · Vote privately</span><span>4 · Make a plan</span></div></Card></section></AppShell>;
}
