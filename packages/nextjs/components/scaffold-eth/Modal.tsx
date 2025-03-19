import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
}

export const Modal = ({ isOpen, onClose, title, message, confirmText, cancelText, onConfirm }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center animate-fadeIn">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl p-8 
        max-w-2xl w-[90%] mx-4 shadow-2xl transform animate-slideIn 
        border border-gray-700/50">
        <h3 className="text-3xl font-bold mb-6 text-center bg-clip-text text-transparent 
          bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 
          animate-pulse-slow">
          {title}
        </h3>
        
        <p className="text-xl text-gray-300 mb-8 text-center leading-relaxed">
          {message}
        </p>
        
        <div className="flex justify-center gap-6">
          {cancelText && (
            <button
              onClick={onClose}
              className="px-8 py-3 text-lg rounded-xl bg-gray-700 hover:bg-gray-600 
                transition-all duration-300 hover:shadow-lg hover:shadow-gray-700/30"
            >
              {cancelText}
            </button>
          )}
          {confirmText && (
            <button
              onClick={() => {
                onConfirm?.();
                onClose();
              }}
              className="px-8 py-3 text-lg font-medium rounded-xl
                bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600
                hover:from-purple-500 hover:via-pink-500 hover:to-purple-500
                transition-all duration-300 transform hover:scale-105
                hover:shadow-lg hover:shadow-purple-500/30"
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}; 