'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Button, Card, Input } from '@/components/ui';
import { mockRoom } from '@/features/room/mock-room';

export default function CreatePage() {
  const router = useRouter(); const [title, setTitle] = useState('Friday night dinner');
  return <AppShell><section className="page-intro"><p className="eyebrow">New decision</p><h1 className="room-title">Start with a good question.</h1><p className="lede">This is a polished mock setup. Nothing is saved or shared yet.</p></section><Card><form className="stack" onSubmit={(event) => { event.preventDefault(); router.push(`/room/${mockRoom.session.id}`); }}><label className="form-label" htmlFor="decision-title">What are you deciding?<Input id="decision-title" value={title} onChange={(event) => setTitle(event.target.value)} required /></label><div><h2>Suggested options</h2>{mockRoom.session.options.map((option) => <div className="option-line" key={option.id}><span className="option-number">{option.order + 1}</span>{option.label}</div>)}</div><Button type="submit">Create mock room</Button></form></Card></AppShell>;
}
