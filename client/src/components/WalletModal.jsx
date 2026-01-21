import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

const WalletModal = ({ isOpen, onClose, coins, setCoins }) => {
  if (!isOpen) return null;

  const handleBuy = (amount) => {
    // Simulate API call
    const btn = document.getElementById(`buy-btn-${amount}`);
    if (btn) {
      const originalText = btn.textContent;
      btn.textContent = 'Processing...';
      btn.disabled = true;

      setTimeout(() => {
        setCoins(prev => prev + amount);
        btn.textContent = 'Success!';
        
        setTimeout(() => {
          btn.textContent = originalText;
          btn.disabled = false;
          onClose();
          alert(`Successfully added ${amount} coins!`);
        }, 1000);
      }, 1500);
    }
  };

  return (
    <div className="modal active">
      <div className="modal-content wallet-content">
        <div className="modal-header">
          <h2>Get Coins</h2>
          <button className="close-modal" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        
        <div className="wallet-grid">
          <div className="coin-package">
            <div className="coin-amount">100 Coins</div>
            <div className="coin-price">Free</div>
            <button 
              id="buy-btn-100"
              className="buy-btn" 
              onClick={() => handleBuy(100)}
            >
              Claim Daily
            </button>
          </div>
          
          <div className="coin-package popular">
            <div className="package-tag">Popular</div>
            <div className="coin-amount">500 Coins</div>
            <div className="coin-price">$4.99</div>
            <button 
              id="buy-btn-500"
              className="buy-btn" 
              onClick={() => handleBuy(500)}
            >
              Buy Now
            </button>
          </div>
          
          <div className="coin-package">
            <div className="coin-amount">1200 Coins</div>
            <div className="coin-price">$9.99</div>
            <button 
              id="buy-btn-1200"
              className="buy-btn" 
              onClick={() => handleBuy(1200)}
            >
              Buy Now
            </button>
          </div>
        </div>
        
        <p className="wallet-note">Coins can be used for premium features and gifts.</p>
      </div>
    </div>
  );
};

export default WalletModal;
