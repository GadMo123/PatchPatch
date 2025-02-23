import React, { createContext, useContext, useState } from "react";

interface BuyInContextType {
  isBuyInDialogOpen: boolean;
  openBuyInDialog: () => void;
  closeBuyInDialog: () => void;
  buyInError?: string;
  setBuyInError: (error?: string) => void;
}

const BuyInContext = createContext<BuyInContextType | null>(null);

export const BuyInProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isBuyInDialogOpen, setIsBuyInDialogOpen] = useState(false);
  const [buyInError, setBuyInError] = useState<string>();

  const openBuyInDialog = () => setIsBuyInDialogOpen(true);
  const closeBuyInDialog = () => {
    setIsBuyInDialogOpen(false);
    setBuyInError(undefined);
  };

  return (
    <BuyInContext.Provider
      value={{
        isBuyInDialogOpen,
        openBuyInDialog,
        closeBuyInDialog,
        buyInError,
        setBuyInError,
      }}
    >
      {children}
    </BuyInContext.Provider>
  );
};

export const useBuyInDialog = () => {
  const context = useContext(BuyInContext);
  if (!context) {
    throw new Error("useBuyInDialog must be used within a BuyInProvider");
  }
  return context;
};
