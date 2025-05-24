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
});

export function GeneralProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [userToken, setUserToken] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");

  const showLoading = () => setIsLoading(true);
  const hideLoading = () => setIsLoading(false);

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
      }}
    >
      {children}
      {isLoading && <LoadingOverlay />}
    </GeneralContext.Provider>
  );
}

export const useGeneralContext = () => useContext(GeneralContext);
