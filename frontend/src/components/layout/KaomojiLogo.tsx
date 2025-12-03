interface KaomojiLogoProps {
  onClick?: () => void;
}

export function KaomojiLogo({ onClick }: KaomojiLogoProps) {
  return (
    <button
      className="logo"
      onClick={onClick}
      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
    >
      <span className="logo-kaomoji">(◕‿◕)</span>
      <span className="logo-text">druzi</span>
    </button>
  );
}
