# Мониторинг работ — НК

Система мониторинга статусов НК для оборудования и трубопроводов.  
Стек: Next.js 14 + Supabase + Bootstrap 5. Деплой на Vercel.

---

## Установка и деплой

### 1. Supabase

1. Создайте проект на [supabase.com](https://supabase.com)
2. **SQL Editor** → выполните `supabase_schema.sql`
3. Скопируйте из **Settings → API**:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Publishable key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Secret key → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Конфигурация

Отредактируйте `lib/config.js`:
- `INSTALLATIONS` — список установок (позиции хранятся в БД)
- `STATUSES` — список статусов
- `BLOCK_REASONS` — причины блокировки

### 3. Переменные окружения

Создайте `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
```

В Vercel добавьте те же три переменные в **Settings → Environment Variables**.

### 4. Запуск локально

```bash
npm install
npm run dev
```

### 5. Первый администратор

В Supabase: **Authentication → Users → Add user** — создайте пользователя.  
Затем в **SQL Editor**:

```sql
UPDATE auth.users
SET raw_user_meta_data = '{"role": "admin"}'
WHERE email = 'ваш@email.com';
```

Остальных пользователей создавайте через панель **⚙ Администратор** на сайте.

---

## Роли

| Роль | Возможности |
|------|-------------|
| `master` | Просмотр, смена статусов, примечания |
| `admin` | Всё выше + управление оборудованием и пользователями |

---

## Excel-импорт (формат)

| inst_id | reg_number | status_id | nk_percent |
|---------|------------|-----------|------------|
| inst_1  | ТП-101     | nk_done   |            |
| inst_1  | ТП-102     | nk_prep   | 75         |

Значения `status_id`: `pending`, `prepared`, `silenced`, `isolation`, `nk_prep`, `nk_ready`, `nk_progress`, `nk_done`

---

## Структура проекта

```
lib/config.js              # Конфигурация установок и статусов
lib/supabase.js            # Клиент Supabase
pages/index.js             # Страница входа
pages/dashboard.js         # Основной интерфейс (мобильный)
pages/admin.js             # Панель администратора
pages/api/create-user.js   # API: создание пользователя
pages/api/excel-export.js  # API: выгрузка в Excel
pages/api/excel-import.js  # API: импорт из Excel
styles/globals.css         # Стили
supabase_schema.sql        # SQL-схема БД
```
