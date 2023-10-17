import React from "react";
import { TokenProvider } from "./useToken";
import { WalletProvider } from "./useWallet";

function ContextProvider({ children }) {
  return (
    <WalletProvider>
      <TokenProvider>{children}</TokenProvider>
    </WalletProvider>
  );
}

export default ContextProvider;
