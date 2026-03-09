import React from 'react';
import { motion } from 'framer-motion';

// Spinner simple
export function Spinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <motion.div
      className={`inline-block border-4 border-[#374357] border-t-blue-500 rounded-full ${sizeClasses[size]} ${className}`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
  );
}

// Skeleton loader pour les lignes de tableau
export function TableRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-4">
        <div className="h-4 bg-[#252D42] rounded w-4"></div>
      </td>
      <td className="px-4 py-4">
        <div className="h-4 bg-[#252D42] rounded w-20"></div>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-[#252D42] rounded-lg mr-3"></div>
          <div className="h-4 bg-[#252D42] rounded w-16"></div>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="h-6 bg-[#252D42] rounded-full w-12"></div>
      </td>
      <td className="px-4 py-4">
        <div className="h-6 bg-[#252D42] rounded w-12"></div>
      </td>
      <td className="px-4 py-4">
        <div className="h-6 bg-[#252D42] rounded w-16"></div>
      </td>
      <td className="px-4 py-4">
        <div className="h-6 bg-[#252D42] rounded w-16"></div>
      </td>
      <td className="px-4 py-4">
        <div className="h-6 bg-[#252D42] rounded w-12"></div>
      </td>
      <td className="px-4 py-4">
        <div className="h-4 bg-[#252D42] rounded w-20"></div>
      </td>
      <td className="px-4 py-4">
        <div className="h-4 bg-[#252D42] rounded w-20"></div>
      </td>
      <td className="px-4 py-4">
        <div className="h-4 bg-[#252D42] rounded w-12"></div>
      </td>
      <td className="px-4 py-4">
        <div className="h-4 bg-[#252D42] rounded w-12"></div>
      </td>
      <td className="px-4 py-4">
        <div className="h-6 bg-[#252D42] rounded w-16"></div>
      </td>
      <td className="px-4 py-4">
        <div className="h-6 bg-[#252D42] rounded w-8"></div>
      </td>
      <td className="px-4 py-4">
        <div className="h-4 bg-[#252D42] rounded w-16"></div>
      </td>
    </tr>
  );
}

// Skeleton pour les stats cards
export function StatCardSkeleton() {
  return (
    <div className="bg-[#1E2536] rounded-xl p-5 border border-[#2D3548] animate-pulse">
      <div className="h-4 bg-[#252D42] rounded w-20 mb-2"></div>
      <div className="h-8 bg-[#252D42] rounded w-24"></div>
    </div>
  );
}

// Loading overlay pour toute la page
export function LoadingOverlay({ message = 'Loading...' }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#0F1419] bg-opacity-60 flex items-center justify-center z-50"
    >
      <div className="bg-[#1E2536] rounded-xl p-8 border border-[#2D3548] flex flex-col items-center">
        <Spinner size="lg" className="mb-4" />
        <p className="text-white font-semibold">{message}</p>
      </div>
    </motion.div>
  );
}

// Progress bar
export function ProgressBar({ progress = 0, className = '' }) {
  return (
    <div className={`w-full bg-[#252D42] rounded-full h-2 overflow-hidden ${className}`}>
      <motion.div
        className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.3 }}
      />
    </div>
  );
}