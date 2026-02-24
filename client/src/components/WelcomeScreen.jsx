import React from "react";

const WelcomeScreen = () => (
  <div className="flex flex-col items-center justify-center h-full bg-[#222e35] gap-6 select-none">
    <div className="w-20 h-20 rounded-full bg-[#2a3942] flex items-center justify-center">
      <svg viewBox="0 0 24 24" className="w-10 h-10 fill-[#8696a0]">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
      </svg>
    </div>
    <div className="text-center">
      <h2 className="text-[#e9edef] text-2xl font-light mb-2">Bolio Web</h2>
      <p className="text-[#8696a0] text-sm max-w-xs leading-relaxed">
        Send and receive messages securely.
      </p>
    </div>
    <div className="flex gap-4 mt-2">
      {["Send document", "Add contact", "New group"].map((label) => (
        <div
          key={label}
          className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#2a3942] text-[#8696a0] text-xs w-28 text-center"
        >
          <div className="w-8 h-8 rounded-full bg-[#374045] flex items-center justify-center text-base">
            {label === "Send document" ? "📄" : label === "Add contact" ? "👤" : "👥"}
          </div>
          {label}
        </div>
      ))}
    </div>
  </div>
);

export default WelcomeScreen;
