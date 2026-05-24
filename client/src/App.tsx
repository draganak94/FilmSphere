import { BrowserRouter, Route, Routes } from 'react-router-dom';
import ChatWidget from './components/ChatWidget';
import PrivateRoute from './components/PrivateRoute';
import FilmPage from './pages/FilmPage';
import FriendsPage from './pages/FriendsPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import WatchlistPage from './pages/WatchlistPage';
import LikedPage from './pages/LikedPage';
import WatchedPage from './pages/WatchedPage';
import DiaryPage from './pages/DiaryPage';
import DiaryEntryPage from './pages/DiaryEntryPage';
import ProfilePage from './pages/ProfilePage';
import UserProfilePage from './pages/UserProfilePage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<PrivateRoute />}>
          <Route path="/films/:id" element={<FilmPage />} />
          <Route path="/watched" element={<WatchedPage />} />
          <Route path="/diary" element={<DiaryPage />} />
          <Route path="/diary/:filmId" element={<DiaryEntryPage />} />
          <Route path="/liked" element={<LikedPage />} />
          <Route path="/watchlist" element={<WatchlistPage />} />
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/users/:username" element={<UserProfilePage />} />
        </Route>
      </Routes>
      <ChatWidget />
    </BrowserRouter>
  );
}
