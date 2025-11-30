interface FooterProps {
  onLogout: () => void;
}

export function Footer({ onLogout }: FooterProps) {
  return (
    <footer className="footer">
      <span>druzi v1.0</span>
      <button
        className="btn--text"
        onClick={onLogout}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontSize: 'inherit',
          color: 'var(--fg-dim)',
        }}
      >
        Logout
      </button>
    </footer>
  );
}
