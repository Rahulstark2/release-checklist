import { BrowserRouter, Routes, Route } from "react-router-dom";
import ReleasesList from "./pages/ReleasesList";
import ReleaseDetail from "./pages/ReleaseDetail";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ReleasesList />} />
        <Route path="/releases/:id" element={<ReleaseDetail />} />
      </Routes>
    </BrowserRouter>
  );
}
