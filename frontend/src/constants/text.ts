// Mixed Ukrainian/German terminology for the app
export const TEXT = {
  // Navigation
  nav: {
    upload: 'ЗАВАНТАЖИТИ', // Ukrainian: upload
    hilfe: 'HILFE',        // German: help
  },
  // Login
  login: {
    title: 'ZUGANG ОБМЕЖЕНО', // German: access + Ukrainian: restricted
    passwordLabel: 'ПАРОЛЬ / PASSWORT',
    placeholder: 'введіть код...', // Ukrainian: enter code
    submit: 'УВІЙТИ',      // Ukrainian: enter
    loading: '[SYS] ПЕРЕВІРКА...', // Ukrainian: checking
    error: '[ERR] Невірний пароль / Falsches Passwort', // Ukrainian + German: wrong password
    serverError: '[ERR] Server nicht erreichbar', // German: server not reachable
  },
  // Upload
  upload: {
    title: 'DATEI HOCHLADEN', // German: upload file
    subtitle: 'Зображення та відео • Bilder und Videos', // Ukrainian + German: images and videos
    dropText: 'DATEIEN HIERHER ZIEHEN',  // German: drag files here
    dropHint: 'або натисніть для вибору', // Ukrainian: or click to select
    selected: 'Обрано:', // Ukrainian: selected
    submit: 'ÜBERTRAGEN', // German: transfer
    loading: '[SYS] ПЕРЕДАЧА...', // Ukrainian: transferring
    success: '[OK] Datei erfolgreich übertragen', // German: file successfully transferred
    error: '[ERR]', // Error prefix
  },
  // Camera capture
  camera: {
    subtitle: 'Фото або відео • Foto oder Video', // Ukrainian + German: photo or video
    photo: 'ФОТО',    // Ukrainian: photo
    video: 'ВІДЕО',   // Ukrainian: video
    start: 'START',
    stop: 'STOP',
    capture: 'ЗНЯТО', // Ukrainian: capture
    retake: 'ПОВТОР / NOCHMAL', // Ukrainian + German: retake
    use: 'VERWENDEN', // German: use
    recording: '[REC] ЗАПИС...', // Ukrainian: recording
    noCamera: '[ERR] Kamera nicht verfügbar', // German: camera not available
    permissionDenied: '[ERR] Доступ заборонено / Zugang verweigert', // Ukrainian + German: access denied
    switchCamera: 'SWAP', // Camera switch
    capturingSecond: '[SYS] Друге фото...', // Ukrainian: second photo
    front: 'FRONT',
    back: 'BACK',
  },
  // Mode selector
  mode: {
    upload: 'DATEI', // German: file
    capture: 'KAMERA', // German: camera
  },
  // Footer
  footer: {
    session: 'СЕСІЯ АКТИВНА', // Ukrainian: session active
    logout: 'ВИЙТИ / ABMELDEN', // Ukrainian + German: logout
  },
  // Help/Info (shown when clicking HILFE)
  hilfe: {
    title: 'СИСТЕМНА ІНФОРМАЦІЯ', // Ukrainian: system information
    items: [
      '[SYS] Максимальний розмір: 50MB', // Ukrainian: max size
      '[SYS] Формати: JPEG, PNG, GIF, WEBP, MP4',
      '[NET] Übertragung verschlüsselt', // German: transfer encrypted
      '[NET] Зберігання: приватний сервер', // Ukrainian: storage: private server
      '[CAM] BeReal-стиль: два фото', // Ukrainian: BeReal style: two photos
    ]
  },
  // Notifications
  notifications: {
    title: 'НАГАДУВАННЯ / ERINNERUNGEN', // Ukrainian + German: reminders
    description: 'Щодня випадковий час для фото / Täglich zufällige Zeit für Foto', // Ukrainian + German: daily random time for photo
    on: 'УВІМК', // Ukrainian: on
    off: 'ВИМК', // Ukrainian: off
    loading: '[SYS]...',
    unsupported: '[ERR] Сповіщення не підтримуються / Benachrichtigungen nicht unterstützt', // Ukrainian + German: notifications not supported
    denied: '[ERR] Доступ заборонено в налаштуваннях / Zugang in Einstellungen verweigert', // Ukrainian + German: access denied in settings
    nextReminder: 'Наступне / Nächste:', // Ukrainian + German: next
    timeWindow: '[INFO] Вікно: 9:00 - 22:00', // Time window info
    permissionRequest: 'Дозволити сповіщення? / Benachrichtigungen erlauben?', // Ukrainian + German: allow notifications?
    testButton: '[TEST] НАДІСЛАТИ ЗАРАЗ', // Ukrainian: send now
  }
} as const;

