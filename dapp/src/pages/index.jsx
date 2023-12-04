import React from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import DappLayout from "../components/layouts/DappLayout";
import ContextProvider from "../utils/contexts";
import JackpotScreen from "./jackpot";
import StakeScreen from "./stake";

function Root() {
  return (
    <Router>
      <ContextProvider>
        <DappLayout>
          <Routes>
            <Route path="/stake" element={<StakeScreen />} />
            <Route path="/jackpot" element={<JackpotScreen />} />
          </Routes>
        </DappLayout>
      </ContextProvider>
    </Router>
  );
}

export default Root;
