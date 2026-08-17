import React from 'react';

function WhatsAppWidget() {
  const handleWhatsAppClick = () => {
    window.open('https://wa.me/919876543210?text=Hello%20Sanjivani%20Farm,%20I%20want%20to%20know%20more%20about%20your%20dairy%20products!', '_blank');
  };

  return (
    <button
      onClick={handleWhatsAppClick}
      title="Chat with us on WhatsApp"
      className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:bg-[#20ba5a] transition-all transform hover:scale-105 flex items-center justify-center"
    >
      <span className="text-2xl">💬</span>
    </button>
  );
}

export default WhatsAppWidget;
