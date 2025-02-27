
// App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Songs from "./pages/Songs";
import SongDetail from "./pages/SongDetail";
import WeekSongs from "./pages/WeekSongs";
import SongCreate from "./pages/SongCreate";
import Login from "./pages/Login";
import ProtectedRoute from "./pages/ProtectedRoute";
import SelectWeekSongs from "./pages/SelectWeekSongs"; 
import GuitarTabs from "./pages/GuitarTabs";
import GuitarTabDetail from "./pages/GuitarTabDetail";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Index />
          </ProtectedRoute>
        }
      />
      <Route
        path="/songs"
        element={
          <ProtectedRoute>
            <Songs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/songs/:id"
        element={
          <ProtectedRoute>
            <SongDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/week-songs"
        element={
          <ProtectedRoute>
            <WeekSongs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/select-week-songs"
        element={
          <ProtectedRoute>
            <SelectWeekSongs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-song"
        element={
          <ProtectedRoute>
            <SongCreate />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/guitar-tabs"
        element={
          <ProtectedRoute>
            <GuitarTabs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/guitar-tabs/:id"
        element={
          <ProtectedRoute>
            <GuitarTabDetail />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

export default App;
