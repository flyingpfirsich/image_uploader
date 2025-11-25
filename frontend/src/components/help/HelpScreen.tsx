import { TEXT } from '../../constants/text';
import { NotificationSettings } from '../settings/NotificationSettings';

export function HelpScreen() {
  return (
    <div className="help-screen">
      <NotificationSettings />
      
      <div className="help-section">
        <p className="section-title">{TEXT.hilfe.title}</p>
        <ul className="info-list">
          {TEXT.hilfe.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

