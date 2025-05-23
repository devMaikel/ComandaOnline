import { createContext, useContext, useState, ReactNode } from "react";
import LoadingOverlay from "../components/LoadingOverlay";

const GeneralContext = createContext({
  showLoading: () => {},
  hideLoading: () => {},
});

export function GeneralProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);

  const showLoading = () => setIsLoading(true);
  const hideLoading = () => setIsLoading(false);

  return (
    <GeneralContext.Provider value={{ showLoading, hideLoading }}>
      {children}
      {isLoading && <LoadingOverlay />}
    </GeneralContext.Provider>
  );
}

export const useGeneralContext = () => useContext(GeneralContext);
