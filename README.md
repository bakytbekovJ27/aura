# ✨ AURA — AI Стилист

Полноценное SaaS приложение: React фронтенд + Django REST API бэкенд + Django Admin.

---

## 📁 Структура проекта

```
aura_project/
├── backend/                  # Django REST API
│   ├── aura_backend/
│   │   ├── settings.py       # Настройки Django
│   │   └── urls.py           # Главные URL
│   ├── stylist/
│   │   ├── models.py         # БД модели
│   │   ├── admin.py          # Кастомная Admin-панель
│   │   ├── views.py          # API Views
│   │   ├── serializers.py    # DRF Serializers
│   │   ├── urls.py           # API URLs
│   │   └── signals.py        # Auto-create Profile
│   ├── manage.py
│   └── requirements.txt
│
└── frontend/                 # React SPA
    ├── src/
    │   ├── api/
    │   │   └── client.js     # Fetch + JWT interceptors
    │   ├── hooks/
    │   │   ├── useAuth.jsx   # Auth context
    │   │   └── useToast.jsx  # Toast notifications
    │   ├── components/
    │   │   └── Sidebar.jsx   # Navigation sidebar
    │   ├── pages/
    │   │   ├── AuthPages.jsx # Login + Register
    │   │   ├── Dashboard.jsx # Главная страница
    │   │   ├── MakeupPage.jsx# AR камера + сессии
    │   │   ├── WardrobePage.jsx # CRUD гардероб
    │   │   ├── TipsPage.jsx  # AI советы
    │   │   └── ProfilePage.jsx # Профиль пользователя
    │   ├── App.jsx           # Роутинг
    │   ├── index.js          # Entry point
    │   └── index.css         # Все стили (розовый дизайн)
    └── package.json
```

---

## 🚀 Запуск проекта

### 1. Бэкенд (Django)

```bash
cd backend

# Создай виртуальное окружение
python -m venv venv
source venv/bin/activate      # Linux / Mac
venv\Scripts\activate         # Windows

# Установи зависимости
pip install -r requirements.txt

# Применить миграции
python manage.py makemigrations
python manage.py migrate

# Создать суперпользователя для Admin-панели
python manage.py createsuperuser

# Запустить сервер
python manage.py runserver
```

API будет доступно на: `http://localhost:8000`
Admin-панель:          `http://localhost:8000/admin`

---

### 2. Фронтенд (React)

```bash
cd frontend

npm install
npm start
```

Сайт откроется на: `http://localhost:3000`

---

## 🔑 API Endpoints

| Метод | URL | Описание |
|-------|-----|----------|
| POST | `/api/register/` | Регистрация |
| POST | `/api/auth/token/` | Получить JWT токен |
| POST | `/api/auth/token/refresh/` | Обновить токен |
| GET/PATCH | `/api/profile/` | Профиль пользователя |
| GET | `/api/dashboard/` | Дашборд + статистика |
| GET/POST | `/api/wardrobe/` | Список вещей гардероба |
| GET/PATCH/DELETE | `/api/wardrobe/{id}/` | Конкретная вещь |
| POST | `/api/wardrobe/{id}/toggle_favorite/` | Переключить "любимая" |
| POST | `/api/wardrobe/{id}/worn/` | +1 к счётчику носки |
| GET | `/api/wardrobe/stats/` | Статистика гардероба |
| GET/POST | `/api/chat-sessions/` | Список диалогов с ассистентом |
| GET/POST | `/api/chat-sessions/{id}/messages/` | История и отправка сообщений |
| GET/POST | `/api/recommendations/` | AI рекомендации |

---

## 🗄️ Модели базы данных

### UserProfile
Расширение стандартного User:
- `occupation` — работа / роль
- `lifestyle` — повседневный ритм
- `favorite_occasions` — любимые сценарии
- `city_climate` — город / климат
- `sizes_note` — заметка о размерах
- `bio` — кратко о себе

### WardrobeItem
Вещи гардероба:
- `name`, `category`, `color`, `brand`
- `season`, `is_favorite`, `times_worn`
- `image` — фото вещи

### ChatSession / ChatMessage
История общения со стилистом:
- `title` — заголовок диалога
- `role` — пользователь или ассистент
- `content` — текст сообщения

### AIRecommendation
Записи AI-анализов:
- `rec_type`, `input_params` (JSON)
- `result` (JSON)

---

## 🛠 Django Admin

После запуска бэкенда открой `http://localhost:8000/admin`

В панели управления:
- 📋 Управление пользователями и профилями
- 👗 Просмотр гардеробов всех пользователей
- 💡 Управление советами стилиста
- 💄 История сессий макияжа
- 🤖 AI рекомендации
- 📊 Статистика использования

---

## ⚙️ Переменные окружения

Создай файл `backend/.env`:
```env
SECRET_KEY=your-super-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

---

## 🎨 Дизайн

- **Цвета**: розовая палитра (var(--rose), var(--rose-deep), var(--blush))
- **Шрифты**: Cormorant Garamond (заголовки) + DM Sans (текст)
- **Стиль**: минималистичный luxury с мягкими тенями и анимациями
- **Компоненты**: карточки, теги, тосты, модалки — всё в `index.css`
