// SafetyContext.js
import React, { createContext, useContext, useState } from 'react';

const SafetyContext = createContext();

export const SafetyProvider = ({ children }) => {
  const [safetyStatus, setSafetyStatus] = useState(null);

  return (
    <SafetyContext.Provider value={{ safetyStatus, setSafetyStatus }}>
      {children}
    </SafetyContext.Provider>
  );
};

export const useSafety = () => {
  const context = useContext(SafetyContext);
  if (!context) {
    throw new Error('useSafety must be used within a SafetyProvider');
  }
  return context;
};