import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { StateMessage } from '@/components/states';
export default function NotFound() {
  return (
    <AppShell>
      <StateMessage title="That page is not here">
        Check the link or return home to start a decision.
      </StateMessage>
      <div className="row" style={{ justifyContent: 'center', marginTop: '1rem' }}>
        <Link className="button button--primary" href="/">
          Return home
        </Link>
      </div>
    </AppShell>
  );
}
