# Мониторинг работ — НК

Система мониторинга статусов НК для оборудования и трубопроводов.

## Быстрый старт

### 1. Supabase

1. Создайте проект на [supabase.com](https://supabase.com)
2. В разделе **SQL Editor** выполните скрипт `supabase_schema.sql`
3. Скопируйте из **Settings → API**:
   - `Project URL`
   - `anon` public key
   - `service_role` key (только для сервера!)

### 2. Конфигурация

Отредактируйте `lib/config.js`:
- **INSTALLATIONS** — список установок и их позиций (рег. номера)
- **ADMIN_EMAILS** — email-адреса администраторов

### 3. Переменные окружения

Создайте `.env.local` (пример в `.env.local.example`):
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 4. Запуск локально

```bash
npm install
npm run dev
```

### 5. Деплой на Vercel

```bash
npx vercel --prod
```

В панели Vercel добавьте переменные окружения:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 6. Первый вход

Создайте первого администратора прямо в Supabase:
**Authentication → Users → Add user**
Email должен совпадать с одним из `ADMIN_EMAILS` в config.js.

После входа используйте панель **Администратора** для создания остальных пользователей.

---

## Структура проекта

```
pages/
  index.js          # Страница входа
  dashboard.js      # Основной интерфейс
  admin.js          # Панель администратора
  api/
    create-user.js  # Создание пользователя Supabase Auth
    excel-export.js # Выгрузка статусов в xlsx
    excel-import.js # Импорт позиций из xlsx
lib/
  config.js         # ← РЕДАКТИРОВАТЬ: установки, позиции, admins
  supabase.js       # Клиент Supabase
styles/
  globals.css
supabase_schema.sql # SQL для создания таблиц
```

## Excel-файл (импорт)

Формат листа:
| inst_id | reg_number | status_id | nk_percent |
|---------|------------|-----------|------------|
| inst_1  | ТП-101     | nk_done   |            |
| inst_1  | ТП-102     | nk_prep   | 75         |

`status_id` — одно из: `prepared`, `silenced`, `isolation`, `nk_prep`, `nk_ready`, `nk_progress`, `nk_done`

## Отчёт

На странице Dashboard → вкладка **Отчёт** выводится сводка по установке:
```
На текущий момент по Установка 1:
Подготовлено к передаче ПО  2 поз.
Отглушено                   1 поз.
...
```
