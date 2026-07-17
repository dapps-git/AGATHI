import React from 'react';
import { Check, ShoppingBag } from 'lucide-react';

const ProductCard = ({ product, onBuyNow }) => {
  return (
    <div className="product-card">
      <div className="product-img-wrapper">
        {product.images && product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="product-card-img"
            onError={(e) => {
              // Fallback if image fails to load
              e.target.onerror = null;
              e.target.src = 'https://placehold.co/300x300/f0f3ee/2f4f1e?text=Agadhi+Churna';
            }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifycontent: 'center', backgroundColor: 'var(--accent-green)' }}>
            <span style={{ color: 'var(--primary-green)', fontWeight: 'bold' }}>Agadhi Choorna</span>
          </div>
        )}
      </div>

      <div className="product-card-content">
        <h3 className="product-card-title">{product.name}</h3>
        <p className="product-card-desc">{product.description}</p>

        {product.benefits && product.benefits.length > 0 && (
          <ul className="product-benefits-list">
            {product.benefits.slice(0, 4).map((benefit, index) => (
              <li key={index} className="product-benefit-item">
                <Check size={14} />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="product-card-footer">
          <div className="product-price">₹{product.price}</div>
          <button onClick={() => onBuyNow(product)} className="btn btn-primary" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
            <ShoppingBag size={16} />
            <span>Buy Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
