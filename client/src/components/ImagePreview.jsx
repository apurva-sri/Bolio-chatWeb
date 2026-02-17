import React from "react";

const ImagePreview = ({ imageUrl, onClose }) => {
  return (
    <div className="fixed inset-0 bg-white z-[999] flex items-center justify-center">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-2xl font-bold"
      >
        ✕
      </button>

      {/* Image */}
      <img
        src={imageUrl}
        alt="preview"
        className="max-h-[90vh] max-w-[90vw] object-contain"
      />
    </div>
  );
};

export default ImagePreview;
