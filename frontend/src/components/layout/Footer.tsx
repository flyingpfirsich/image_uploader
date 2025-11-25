import { TEXT } from '../../constants/text';

interface FooterProps {
  onLogout: () => void;
}

export function Footer({ onLogout }: FooterProps) {
  return (
    <footer className="footer">
      <span>{TEXT.footer.session}</span>
      <button className="btn btn--text" onClick={onLogout}>
        {TEXT.footer.logout}
      </button>
    </footer>
  );
}

