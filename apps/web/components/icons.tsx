import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function IconFrame({ children, ...props }: IconProps) {
  return (
    <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20" {...props}>
      {children}
    </svg>
  );
}

const stroke = {
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  strokeWidth: 1.8,
};

export function BrandMark(props: IconProps) {
  return (
    <IconFrame viewBox="0 0 32 32" {...props}>
      <path d="M8 9.5 16 5l8 4.5v9L16 27l-8-8.5v-9Z" fill="currentColor" opacity=".16" />
      <path d="m10.5 15.5 4 4 7-8" {...stroke} />
    </IconFrame>
  );
}

export function ArrowIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path d="M5 12h14M14 7l5 5-5 5" {...stroke} />
    </IconFrame>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path d="M12 5v14M5 12h14" {...stroke} />
    </IconFrame>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" {...stroke} />
    </IconFrame>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path d="m5 12.5 4.2 4.2L19 7" {...stroke} />
    </IconFrame>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <rect height="13" rx="2" width="13" x="8" y="8" {...stroke} />
      <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" {...stroke} />
    </IconFrame>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" {...stroke} />
      <circle cx="9" cy="7" r="4" {...stroke} />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" {...stroke} />
    </IconFrame>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <rect height="11" rx="2" width="16" x="4" y="10" {...stroke} />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" {...stroke} />
    </IconFrame>
  );
}

export function SparkIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4L12 3Z" {...stroke} />
      <path d="m18.5 15 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" {...stroke} />
    </IconFrame>
  );
}

export function VoteIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path d="m8 3 8 2-2 8-8-2 2-8Z" {...stroke} />
      <path d="m10 7 1.2 1.2L14 6M5 13l-2 8h18l-2-8M8 17h8" {...stroke} />
    </IconFrame>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path
        d="M20 7v5h-5M4 17v-5h5M6.1 8a7 7 0 0 1 11.4-2.1L20 8M4 16l2.5 2.1A7 7 0 0 0 17.9 16"
        {...stroke}
      />
    </IconFrame>
  );
}

export function ShareIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <circle cx="18" cy="5" r="3" {...stroke} />
      <circle cx="6" cy="12" r="3" {...stroke} />
      <circle cx="18" cy="19" r="3" {...stroke} />
      <path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4" {...stroke} />
    </IconFrame>
  );
}
