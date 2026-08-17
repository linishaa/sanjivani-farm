import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // 1. Read stored session details
  const savedUser = localStorage.getItem('currentUser');
  let userObj = null;

  try {
    userObj = savedUser ? JSON.parse(savedUser) : null;
  } catch (e) {
    console.error('Error parsing currentUser session:', e);
  }

  const isAdminLoggedIn = localStorage.getItem('isAdminLoggedIn') === 'true';
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  // 2. Validate if user has admin privileges
  const isAuthorized = isAdminLoggedIn || isAdmin || userObj?.role === 'admin';

  // 3. Redirect if unauthorized
  if (!isAuthorized) {
    alert('Access Denied: You must be logged in as Staff/Admin to view this page.');
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;