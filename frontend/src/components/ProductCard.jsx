import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Eye } from 'lucide-react';

const ProductCard = ({ product, onBuyNow }) => {
  const navigate = useNavigate();

  const handleViewDetails = (e) => {
    e.stopPropagation();
    navigate(`/product/${product._id}`, { state: { product } });
  };

  const mainImage = (product.images && product.images[0]) || '/images/product-pouch.webp';

  const nameLower = product.name ? product.name.toLowerCase() : '';
  const isBottle100ml = nameLower.includes('100 ml') || nameLower.includes('100ml');
  const isHairPack = nameLower.includes('hair pack');
  const isFaceGlow = nameLower.includes('face glow');

  let imgScaleClass = '';
  if (isBottle100ml || isFaceGlow) {
    imgScaleClass = ' product-card-img--scaled-bottle';
  } else if (isHairPack) {
    imgScaleClass = ' product-card-img--scaled-jar';
  }

  return (
    <div className="product-card" onClick={handleViewDetails} style={{ cursor: 'pointer' }}>
      <div className="product-img-wrapper">
        <img
          src={mainImage}
          alt={product.name}
          className={`product-card-img${imgScaleClass}`}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/images/product-pouch.webp';
          }}
        />
      </div>

      <div className="product-card-content">
        <h3 className="product-card-title" title={product.name}>
          {product.name}
        </h3>

        <div className="product-price">₹{product.price}</div>

        <div className="product-card-actions">
          <button
            type="button"
            onClick={handleViewDetails}
            className="btn btn-outline product-btn-details"
            title="View Details"
          >
            <Eye size={15} />
            <span className="product-btn-text">View Details</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onBuyNow(product);
            }}
            className="btn btn-primary product-btn-buy"
            title="Buy this product"
          >
            <ShoppingBag size={14} />
            <span>Buy Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

