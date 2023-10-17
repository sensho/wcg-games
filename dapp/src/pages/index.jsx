import React from "react";
import DappLayout from "../components/layouts/DappLayout";
import ContextProvider from "../utils/contexts";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import StakeScreen from "./stake";
import JackpotScreen from "./jackpot";

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
