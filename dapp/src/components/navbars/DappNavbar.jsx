import React from "react";
import walletContext from "../../utils/contexts/useWallet";
import LogoComponent from "../LogoComponent";

const NAV_ITEMS = [
  {
    displayName: "Stake",
    href: "/stake",
  },
  {
    displayName: "Jackpot",
    href: "/jackpot",
  },
  {
    displayName: "Swap",
    href: `https://app.uniswap.org/#/swap?use=v2&outputCurrency=${
      import.meta.env.VITE_WCG_TOKEN_ADDRESS
    }`,
  },
];

function DappNavbar() {
  const { activeWallet } = React.useContext(walletContext);

  return (
    <nav className="flex flex-row justify-between items-center p-4">
      <LogoComponent />
      <div className="flex flex-row space-x-4 items-center">
        {NAV_ITEMS.map((item) => (
          <a key={item.displayName} href={item.href}>
            {item.displayName}
          </a>
        ))}
        {!!activeWallet ? (
          <div className="bg-purple-600 rounded-md p-2 text-white">
            Connected to {activeWallet.substr(0, 8)}...
          </div>
        ) : (
          <button
            className="bg-purple-600 rounded-md p-2 text-white"
            onClick={() =>
              window.ethereum.request({ method: "eth_requestAccounts" })
            }
          >
            Connect
          </button>
        )}
      </div>
    </nav>
  );
}

export default DappNavbar;
