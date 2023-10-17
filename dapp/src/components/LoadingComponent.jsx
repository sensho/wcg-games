import React from "react";
import { Bars } from "react-loader-spinner";

function LoadingComponent() {
  return (
    <div className="flex flex-1 justify-center items-center">
      <Bars />
    </div>
  );
}

export default LoadingComponent;
