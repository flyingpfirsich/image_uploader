import { TEXT } from '../../constants/text';

export function HelpScreen() {
  return (
    <div>
      <p className="section-title">{TEXT.hilfe.title}</p>
      <ul className="info-list">
        {TEXT.hilfe.items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

