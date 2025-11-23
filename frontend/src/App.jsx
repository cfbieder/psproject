import { BrowserRouter, Routes, Route } from "react-router-dom";
import Balance from "./pages/Balance.jsx";
import Home from "./pages/Home.jsx";
import UploadPS from "./pages/UploadPS.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/balance" element={<Balance />} />
        <Route path="/upload-ps" element={<UploadPS />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
