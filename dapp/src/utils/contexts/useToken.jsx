import { ethers } from "ethers";
import React, { createContext } from "react";
import LoadingComponent from "../../components/LoadingComponent";
import { removeDecimalsToString } from "../ethers";
import TokenContract from "../ethers/contracts/token";
import walletContext from "./useWallet";

const tokenContext = createContext();

function TokenProvider({ children }) {
  const [isLoading, setIsLoading] = React.useState(true);
  const { activeWallet } = React.useContext(walletContext);
  const [token] = React.useState(new TokenContract());
  const [tokenBalance, setTokenBalance] = React.useState(null);

  React.useEffect(() => {
    (async () => {
      setIsLoading(true);

      if (!activeWallet) return setIsLoading(false);

      setTokenBalance(
        removeDecimalsToString(await token.getBalance(activeWallet))
      );

      setIsLoading(false);
    })();
  }, [token, activeWallet]);

  if (isLoading) return <LoadingComponent />;

  return (
    <tokenContext.Provider value={{ tokenBalance, token }}>
      {children}
    </tokenContext.Provider>
  );
}

export { TokenProvider };

export default tokenContext;
