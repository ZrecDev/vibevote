import { Button, Card } from '@/components/ui';
import { mockResult, mockRoom } from './mock-room';
import { VotingProgress } from './mock-room-components';

export function MockResultScreen() {
  const winner = mockRoom.session.options.find(
    (option) => option.id === mockResult.winnerOptionId,
  )!;
  return (
    <div className="stack">
      <section className="page-intro">
        <p className="eyebrow">Decision complete</p>
        <h1 className="room-title">A plan that feels fair.</h1>
        <p className="lede">The room is ready to move forward together.</p>
      </section>
      <Card className="winner">
        <p className="eyebrow">Tonight’s pick</p>
        <h2>{winner.label}</h2>
        <p>Best Fit · ready for the group</p>
      </Card>
      <Card>
        <p className="eyebrow">The reasoning</p>
        <h2>Why this won</h2>
        <div className="result-why">
          <p>{mockResult.explanation}</p>
          <p className="muted" style={{ marginBottom: 0, fontSize: '.84rem' }}>
            This is an aggregate explanation. No person’s ballot or veto is revealed.
          </p>
        </div>
      </Card>
      <Card className="backup">
        <p className="eyebrow">Plan B</p>
        <h2>Backup option</h2>
        <p style={{ marginBottom: 0 }}>
          <strong>{mockRoom.session.options[1]!.label}</strong> is ready if the plan changes.
        </p>
      </Card>
      <VotingProgress finished={3} total={3} />
      <Card className="action-card">
        <p className="eyebrow">Next step</p>
        <h2>Make it easy to follow through.</h2>
        <p className="muted">These actions are display-only in this mock.</p>
        <div className="row">
          <Button>Share the plan</Button>
          <Button variant="secondary">Open directions</Button>
        </div>
      </Card>
    </div>
  );
}
