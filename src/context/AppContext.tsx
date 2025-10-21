import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

type SelectedItem = { type: "flight" | "airport"; data: any } | null;

type AppContextType = {
  selectedItem: SelectedItem;
  setSelectedItem: (v: SelectedItem) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null); // { type: 'flight' | 'airport', data: {} }

  return (
    <AppContext.Provider value={{ selectedItem, setSelectedItem }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook for convenience
export const useAppContext = (): AppContextType => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
};
