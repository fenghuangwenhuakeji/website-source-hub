export type AdminGlyphName =
  | 'shield'
  | 'user'
  | 'lock'
  | 'dashboard'
  | 'orders'
  | 'packages'
  | 'gift'
  | 'team'
  | 'time'
  | 'menu'
  | 'collapse'
  | 'expand'
  | 'sun'
  | 'moon'
  | 'logout';

interface AdminGlyphProps {
  name: AdminGlyphName;
  className?: string;
}

function iconPaths(name: AdminGlyphName) {
  switch (name) {
    case 'shield':
      return (
        <>
          <path d="M12 3l7 3v5c0 4.5-2.9 8.6-7 10-4.1-1.4-7-5.5-7-10V6l7-3z" />
          <path d="M9.5 12.5l1.7 1.7L14.8 10.6" />
        </>
      );
    case 'user':
      return (
        <>
          <circle cx="12" cy="8" r="3.2" />
          <path d="M5.5 19a6.5 6.5 0 0 1 13 0" />
        </>
      );
    case 'lock':
      return (
        <>
          <rect x="6.5" y="11" width="11" height="8" rx="2.2" />
          <path d="M8.5 11V8.5a3.5 3.5 0 0 1 7 0V11" />
        </>
      );
    case 'dashboard':
      return (
        <>
          <rect x="4" y="4" width="7" height="7" rx="1.5" />
          <rect x="13" y="4" width="7" height="5" rx="1.5" />
          <rect x="13" y="11" width="7" height="9" rx="1.5" />
          <rect x="4" y="13" width="7" height="7" rx="1.5" />
        </>
      );
    case 'orders':
      return (
        <>
          <path d="M5 6.5h14" />
          <path d="M7 10.5h10" />
          <path d="M7 14.5h6" />
          <rect x="4" y="4" width="16" height="16" rx="2" />
        </>
      );
    case 'packages':
      return (
        <>
          <path d="M12 3l8 4.2-8 4.2L4 7.2 12 3z" />
          <path d="M4 7.2V17l8 4 8-4V7.2" />
          <path d="M12 11.4V21" />
        </>
      );
    case 'gift':
      return (
        <>
          <rect x="4" y="8.5" width="16" height="11.5" rx="2" />
          <path d="M12 8.5v11.5" />
          <path d="M4 12.5h16" />
          <path d="M10.3 8.5c-1.8 0-3.3-1.2-3.3-2.7s1.1-2.3 2.5-2.3c1.7 0 2.5 2 2.5 5z" />
          <path d="M13.7 8.5c1.8 0 3.3-1.2 3.3-2.7s-1.1-2.3-2.5-2.3c-1.7 0-2.5 2-2.5 5z" />
        </>
      );
    case 'team':
      return (
        <>
          <circle cx="9" cy="9" r="2.5" />
          <circle cx="16.5" cy="10" r="2" />
          <path d="M4.8 18a4.5 4.5 0 0 1 8.4 0" />
          <path d="M13.5 18a3.5 3.5 0 0 1 6 0" />
        </>
      );
    case 'time':
      return (
        <>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 7.5v5l3.5 2" />
        </>
      );
    case 'menu':
      return (
        <>
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </>
      );
    case 'collapse':
      return (
        <>
          <rect x="4" y="5" width="16" height="14" rx="2" />
          <path d="M9 8.5l-3 3.5 3 3.5" />
          <path d="M13 8v8" />
        </>
      );
    case 'expand':
      return (
        <>
          <rect x="4" y="5" width="16" height="14" rx="2" />
          <path d="M15 8.5l3 3.5-3 3.5" />
          <path d="M11 8v8" />
        </>
      );
    case 'sun':
      return (
        <>
          <circle cx="12" cy="12" r="3.5" />
          <path d="M12 2.5v3" />
          <path d="M12 18.5v3" />
          <path d="M2.5 12h3" />
          <path d="M18.5 12h3" />
          <path d="M5.3 5.3l2.1 2.1" />
          <path d="M16.6 16.6l2.1 2.1" />
          <path d="M18.7 5.3l-2.1 2.1" />
          <path d="M7.4 16.6l-2.1 2.1" />
        </>
      );
    case 'moon':
      return <path d="M18 14.5A6.8 6.8 0 0 1 9.5 6 7.7 7.7 0 1 0 18 14.5z" />;
    case 'logout':
      return (
        <>
          <path d="M10 4H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
          <path d="M14 8l5 4-5 4" />
          <path d="M19 12H10" />
        </>
      );
    default:
      return null;
  }
}

export function AdminGlyph({ name, className }: AdminGlyphProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={['admin-glyph', className].filter(Boolean).join(' ')}
      aria-hidden="true"
    >
      {iconPaths(name)}
    </svg>
  );
}
