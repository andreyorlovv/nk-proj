// ============================================================
// КОНФИГУРАЦИЯ — редактируйте этот файл под свой проект
// ============================================================

// Список установок и их позиций
// Формат: { id: 'уникальный_ид', name: 'Отображаемое название', positions: ['рег. номер', ...] }
export const INSTALLATIONS = [
  {
    id: 'inst_1',
    name: 'Установка 1',
    positions: ['ТП-101', 'ТП-102', 'ТП-103', 'Е-201', 'Е-202', 'К-301'],
  },
  {
    id: 'inst_2',
    name: 'Установка 2',
    positions: ['ТП-401', 'ТП-402', 'Н-501', 'Н-502', 'Т-601', 'Т-602', 'К-701'],
  },
  {
    id: 'inst_3',
    name: 'Установка 3',
    positions: ['ТП-801', 'Е-901', 'Е-902', 'К-1001', 'Н-1101'],
  },
];

// Email-адреса администраторов (должны совпадать с аккаунтами Supabase Auth)
export const ADMIN_EMAILS = [
  'admin@example.com',
  'supervisor@example.com',
];

// Список статусов (порядок важен — отображается в UI и отчёте)
export const STATUSES = [
  { id: 'pending',     label: 'Не начато',                    color: 'warning'   },
  { id: 'prepared',     label: 'Подготовлено к передаче ПО',  color: 'secondary' },
  { id: 'silenced',     label: 'Отглушено',                    color: 'warning'   },
  { id: 'isolation',    label: 'Изоляция снята',               color: 'info'      },
  { id: 'nk_prep',      label: 'Подготовка к НК',              color: 'primary'   }, // процент хранится отдельно
  { id: 'nk_ready',     label: 'Готово к НК',                  color: 'primary'   },
  { id: 'nk_progress',  label: 'НК проводится',                color: 'danger'    },
  { id: 'nk_done',      label: 'НК проведен',                  color: 'success'   },
];
