import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import PrivateRoute from './components/PrivateRoute';
import Home from './pages/Home';
import About from './pages/About';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Profile from './pages/Profile';
import Search from './pages/Search';
import Listing from './pages/Listing';
import CreateListing from './pages/CreateListing';
import UpdateListing from './pages/UpdateListing';
import AgentListings from './pages/AgentListings';
import ManageUsers from './pages/ManageUsers';
import AuditEscrows from './pages/AuditEscrows';

export default function App() {
  return (
    <BrowserRouter>
      {/* Permanent Header Navigation across all pages */}
      <Header />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/search" element={<Search />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />

        {/* Listing Detail Route (mapped to /listing/:id, avoiding any root collisions) */}
        <Route path="/listing/:id" element={<Listing />} />
        <Route path="/listing/:listingId" element={<Listing />} />

        {/* Protected Authenticated Routes */}
        <Route element={<PrivateRoute />}>
          <Route path="/profile" element={<Profile />} />
          <Route path="/agent/my-listings" element={<AgentListings />} />
          <Route path="/create-listing" element={<CreateListing />} />
          <Route path="/update-listing/:listingId" element={<UpdateListing />} />

          {/* Admin & Auditor Governance Routes */}
          <Route path="/admin/manage-users" element={<ManageUsers />} />
          <Route path="/admin/audit-escrows" element={<AuditEscrows />} />
        </Route>

        {/* Fallback wildcard route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}