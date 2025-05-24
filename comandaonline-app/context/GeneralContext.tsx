import React, { createContext, useContext, useState, ReactNode } from "react";
import LoadingOverlay from "../components/LoadingOverlay";

const GeneralContext = createContext({
  showLoading: () => {},
  hideLoading: () => {},
  userToken: "",
  setUserToken: (_token: string) => {},
  userEmail: "",
  setUserEmail: (_token: string) => {},
  userRole: "",
  setUserRole: (_token: string) => {},
  refresh: () => {},
  refreshNumber: 0,
});

export function GeneralProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [userToken, setUserToken] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");
  const [refreshNumber, setRefreshNumber] = useState<number>(0);

  const showLoading = () => setIsLoading(true);
  const hideLoading = () => setIsLoading(false);
  const refresh = () => setRefreshNumber(refreshNumber + 1);

  return (
    <GeneralContext.Provider
      value={{
        showLoading,
        hideLoading,
        userToken,
        setUserToken,
        userEmail,
        setUserEmail,
        userRole,
        setUserRole,
        refresh,
        refreshNumber,
      }}
    >
      {children}
      {isLoading && <LoadingOverlay />}
    </GeneralContext.Provider>
  );
}

export const useGeneralContext = () => useContext(GeneralContext);
