import { BrowserRouter, Routes, Route } from "react-router-dom";
import Balance from "./pages/Balance.jsx";
import CashFlow from "./pages/CashFlow.jsx";
import Home from "./pages/Home.jsx";
import RefreshPS from "./pages/RefreshPS.jsx";
import UploadPS from "./pages/UploadPS.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/balance" element={<Balance />} />
        <Route path="/cash-flow" element={<CashFlow />} />
        <Route path="/upload-ps" element={<UploadPS />} />
        <Route path="/refresh-ps" element={<RefreshPS />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
