import { createContext, useContext, useState } from "react";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [selectedItem, setSelectedItem] = useState(null); // { type: 'flight' | 'airport', data: {} }

  return (
    <AppContext.Provider value={{ selectedItem, setSelectedItem }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook for convenience
export const useAppContext = () => useContext(AppContext);
