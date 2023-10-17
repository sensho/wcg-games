import React, { createContext } from "react";

import detectEthereumProvider from "@metamask/detect-provider";
import { ethers } from "ethers";

const walletContext = createContext();

function WalletProvider({ children }) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [isWalletAvailable, setIsWalletAvailable] = React.useState(false);
  const [activeWallet, setActiveWallet] = React.useState(null);

  React.useEffect(() => {
    (async () => {
      setIsLoading(false);

      const provider = await detectEthereumProvider();

      const ethers_provider = new ethers.providers.Web3Provider(provider);

      if (provider) {
        setIsWalletAvailable(true);
        setActiveWallet(await ethers_provider.getSigner().getAddress());
      } else {
        setIsWalletAvailable(false);
        setActiveWallet(null);
      }

      setIsLoading(false);
    })();
  }, []);

  ethereum.on("chainChanged", handleChainChanged);

  function handleChainChanged(_chainId) {
    window.location.reload();
  }

  ethereum.on("accountsChanged", handleAccountsChanged);

  // For now, 'eth_accounts' will continue to always return an array
  function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
      setActiveWallet(null);
    } else {
      setActiveWallet(accounts[0]);
    }
  }

  if (isLoading) return <h1>Loading</h1>;

  if (!isWalletAvailable) return <h1>No Wallet Detected</h1>;

  return (
    <walletContext.Provider value={{ activeWallet }}>
      {children}
    </walletContext.Provider>
  );
}

export { WalletProvider };

export default walletContext;
