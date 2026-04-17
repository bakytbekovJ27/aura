import { useEffect, useState } from 'react';

const GUIDE_STORAGE_KEY = 'aura-guide-dismissed';

const GUIDE_ITEMS = [
  { icon: '🏠', title: 'Главная', text: 'Краткий обзор статистики, последних вещей и быстрых переходов.' },
  { icon: '👗', title: 'Гардероб', text: 'Основные вещи, фильтры по сезонам и категориям, добавление новых позиций.' },
  { icon: '👜', title: 'Аксессуары', text: 'Отдельный раздел для украшений, ремней, часов, очков и деталей образа.' },
  { icon: '💬', title: 'Ассистент', text: 'Диалоги со стилистом AURA по твоему гардеробу и текущим задачам.' },
  { icon: '✨', title: 'Образы', text: 'Сборка луков, коллекции и быстрая AI-оценка сохранённых комбинаций.' },
  { icon: '👤', title: 'Профиль', text: 'Личные данные, lifestyle-настройки и базовый контекст для рекомендаций.' },
];

export default function FloatingGuide() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(GUIDE_STORAGE_KEY)) {
      setOpen(true);
    }
  }, []);

  const closeGuide = () => {
    localStorage.setItem(GUIDE_STORAGE_KEY, '1');
    setOpen(false);
  };

  return (
    <>
      {open && (
        <div className="guide-panel card fade-up">
          <div className="flex-between" style={{ marginBottom: 14, gap: 12 }}>
            <div>
              <div className="section-title" style={{ marginBottom: 4 }}>Мини-гайд по Aura</div>
              <div className="text-muted" style={{ fontSize: 13 }}>
                Коротко о том, за что отвечает каждый раздел.
              </div>
            </div>
            <button className="modal-close" onClick={closeGuide}>✕</button>
          </div>

          <div className="guide-list">
            {GUIDE_ITEMS.map(item => (
              <div key={item.title} className="guide-item">
                <div className="guide-icon">{item.icon}</div>
                <div>
                  <div className="guide-title">{item.title}</div>
                  <div className="guide-text">{item.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        className="guide-fab"
        onClick={() => setOpen(prev => !prev)}
        aria-label="Открыть мини-гайд по сайту"
        title="Мини-гайд по сайту"
      >
        ?
      </button>
    </>
  );
}
