import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { AttendanceTypeKey } from '@/components/admin/AttendanceTypeDialog';

interface Selection {
  type: AttendanceTypeKey;
  petId: string;
}

interface AttendanceTypeSidebarContextValue {
  selection: Selection | null;
  selectType: (type: AttendanceTypeKey, petId: string | null) => void;
  clearSelection: () => void;
}

const AttendanceTypeSidebarContext = createContext<AttendanceTypeSidebarContextValue | null>(null);

export function AttendanceTypeSidebarProvider({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState<Selection | null>(null);

  const selectType = useCallback((type: AttendanceTypeKey, petId: string | null) => {
    if (petId) setSelection({ type, petId });
    else setSelection(null);
  }, []);

  const clearSelection = useCallback(() => setSelection(null), []);

  return (
    <AttendanceTypeSidebarContext.Provider value={{ selection, selectType, clearSelection }}>
      {children}
    </AttendanceTypeSidebarContext.Provider>
  );
}

export function useAttendanceTypeSidebar() {
  const ctx = useContext(AttendanceTypeSidebarContext);
  if (!ctx) return null;
  return ctx;
}
