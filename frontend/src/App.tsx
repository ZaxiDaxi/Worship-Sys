// App.tsx

import React from "react";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import ProtectedRoute from "./pages/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import Songs from "./components/Songs/Songs";
import SongDetail from "./components/SongDetail/SongDetail";
import WeekSongs from "./pages/WeekSongs";
import SongCreate from "./components/SongCreate/SongCreate";
import GuitarTabs from "./pages/GuitarTabs";
import GuitarTabDetail from "./pages/GuitarTabDetail";
import SelectWeekSongs from "./components/SelectWeekSongs/SelectWeekSongs";
import Login from "./components/reuse/Login";
import NotFound from "./components/reuse/NotFound";
import ProfilePictureCropper from "./components/reuse/ProfilePictureCropper";

// Sidebar (make sure this import path points to your actual Sidebar.tsx)
import { Sidebar } from "./components/Layout/Sidebar";




/** 
 * MainLayout – includes the Sidebar on larger screens
 * and sets up the responsive layout logic. 
 * On mobile, the Sidebar handles “drawer” overlay behavior itself.
 */
function HeaderLayout() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar is always rendered, but internally it decides if it’s a drawer 
          (mobile) or fixed sidebar (desktop) based on screen size. */}
      <Sidebar />

      {/* Main content area – offset to the right of the sidebar on md+ 
          with `md:ml-64`, because the sidebar is 16rem wide. 
          On small screens, the sidebar is overlay, so no left margin needed. */}
      <div className="flex-1 mt-0 md:mt-0 md:ml-64 p-0">
        <Outlet />
      </div>
    </div>
  );
}


function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar is always rendered, but internally it decides if it’s a drawer 
          (mobile) or fixed sidebar (desktop) based on screen size. */}
      <Sidebar />

      {/* Main content area – offset to the right of the sidebar on md+ 
          with `md:ml-64`, because the sidebar is 16rem wide. 
          On small screens, the sidebar is overlay, so no left margin needed. */}
      <div className="flex-1 md:mt-0 md:ml-64 p-4 pt-0 px-0">
        <Outlet />
      </div>
    </div>
  );
}



/**
 * App – configures your routes. 
 * We keep /login separate from the MainLayout (no sidebar),
 * while all other routes are nested inside ProtectedRoute + MainLayout.
 */
const App = () => (
  <BrowserRouter>
    <Routes>
      {/* Public route (no sidebar) */}
      <Route path="/login" element={<Login />} />
      

      {/* Protected routes with the responsive sidebar */}
      <Route element={
        <ProtectedRoute>
          <HeaderLayout />
        </ProtectedRoute>
      }>
        <Route path="/" element={<Index />} />

      </Route>
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        
        <Route path="/songs" element={<Songs />} />
        <Route path="/songs/:id" element={<SongDetail />} />
        <Route path="/week-songs" element={<WeekSongs />} />
        <Route path="/select-week-songs" element={<SelectWeekSongs />} />
        <Route path="/create-song" element={<SongCreate />} />
        <Route path="/guitar-tabs" element={<GuitarTabs />} />
        <Route path="/guitar-tabs/:id" element={<GuitarTabDetail />} />
        <Route path="/profile/crop" element={<ProfilePictureCropper />} />
      </Route>

      {/* Catch-all for unknown routes */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

export default App;
