import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import TaskSheet from '../components/TaskSheet';
import { today } from '../lib/dates';

const SheetContext = createContext(null);

// One task sheet for the whole app: openCreate(date) for a new task, openEdit(task) to view/edit one.
export function SheetProvider({ children }) {
  const [sheet, setSheet] = useState(null);
  const close = useCallback(() => setSheet(null), []);

  const value = useMemo(
    () => ({
      openCreate: (date = today()) => setSheet({ key: `new-${Date.now()}`, task: null, date }),
      openEdit: (task) => setSheet({ key: task.id, task, date: new Date(task.dueAt) }),
    }),
    []
  );

  return (
    <SheetContext.Provider value={value}>
      {children}
      {sheet && <TaskSheet key={sheet.key} task={sheet.task} date={sheet.date} onClose={close} />}
    </SheetContext.Provider>
  );
}

export const useSheet = () => useContext(SheetContext);
