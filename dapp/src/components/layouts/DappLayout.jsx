import React from "react";
import DappNavbar from "../navbars/DappNavbar";

function DappLayout({ children }) {
  return (
    <div className="w-screen flex flex-col items-stretch">
      <DappNavbar />
      {children}
    </div>
  );
}

export default DappLayout;
