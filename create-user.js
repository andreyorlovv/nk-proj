// ============================================================
// КОНФИГУРАЦИЯ — редактируйте этот файл под свой проект
// ============================================================

// Список установок (позиции хранятся в БД Supabase)
export const INSTALLATIONS = [
  { id: 'inst_1', name: 'Установка 1' },
  { id: 'inst_2', name: 'Установка 2' },
  { id: 'inst_3', name: 'Установка 3' },
]

// Роли: 'admin' | 'master'
// Задаётся в Supabase: user_metadata.role
// Для назначения роли используйте панель Админа

// Список статусов
export const STATUSES = [
  { id: 'pending',      label: 'Не начато',                   color: 'warning'   },
  { id: 'prepared',     label: 'Подготовлено к передаче ПО',  color: 'secondary' },
  { id: 'silenced',     label: 'Отглушено',                   color: 'warning'   },
  { id: 'isolation',    label: 'Изоляция снята',              color: 'info'      },
  { id: 'nk_prep',      label: 'Подготовка к НК',             color: 'primary'   },
  { id: 'nk_ready',     label: 'Готово к НК',                 color: 'primary'   },
  { id: 'nk_progress',  label: 'НК проводится',               color: 'danger'    },
  { id: 'nk_done',      label: 'НК проведен',                 color: 'success'   },
]

// Причины блокировки ("не можем начать")
export const BLOCK_REASONS = [
  'Нужны леса',
  'Не снята изоляция',
  'Не подготовлены точки',
]
