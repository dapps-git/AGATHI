import React, { useState, useContext, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, Send, CheckCircle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/api';
import { Country, State, City } from 'country-state-city';

const OrderModal = ({ product, onClose }) => {
  const { user } = useContext(AuthContext);
  const [step, setStep] = useState(1); // Step 1: Customer & Address, Step 2: Product & Quantity, Step 3: Completed / WhatsApp redirecting
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    alternatePhone: '',
    email: '',
    address: '',
    landmark: '',
    district: '',
    state: '',
    country: '',
    pinCode: '',
  });

  const [quantity, setQuantity] = useState(1);

  // country-state-city state
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState('');
  const [selectedStateCode, setSelectedStateCode] = useState('');

  // Prefill details if user is logged in
  useEffect(() => {
    const allCountries = Country.getAllCountries();
    setCountries(allCountries);

    // Default to India
    const defaultCountry = allCountries.find((c) => c.isoCode === 'IN');
    if (defaultCountry) {
      setSelectedCountryCode('IN');
      const countryStates = State.getStatesOfCountry('IN');
      setStates(countryStates);

      // Default to Kerala
      const defaultState = countryStates.find((s) => s.isoCode === 'KL');
      if (defaultState) {
        setSelectedStateCode('KL');
        const stateCities = City.getCitiesOfState('IN', 'KL');
        setCities(stateCities);

        setFormData((prev) => ({
          ...prev,
          name: user ? user.name || '' : '',
          email: user ? user.email || '' : '',
          phone: user ? user.phone || '' : '',
          country: defaultCountry.name,
          state: defaultState.name,
        }));
      }
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleQuantityChange = (val) => {
    if (quantity + val >= 1) {
      setQuantity(quantity + val);
    }
  };

  const handleCountryChange = (e) => {
    const countryName = e.target.value;
    const countryObj = countries.find((c) => c.name === countryName);

    if (countryObj) {
      setSelectedCountryCode(countryObj.isoCode);
      const countryStates = State.getStatesOfCountry(countryObj.isoCode);
      setStates(countryStates);
      setCities([]);
      setSelectedStateCode('');
      setFormData((prev) => ({
        ...prev,
        country: countryName,
        state: '',
        district: '',
      }));
    } else {
      setSelectedCountryCode('');
      setStates([]);
      setCities([]);
      setSelectedStateCode('');
      setFormData((prev) => ({
        ...prev,
        country: '',
        state: '',
        district: '',
      }));
    }
  };

  const handleStateChange = (e) => {
    const stateName = e.target.value;
    const stateObj = states.find((s) => s.name === stateName);

    if (stateObj) {
      setSelectedStateCode(stateObj.isoCode);
      const stateCities = City.getCitiesOfState(selectedCountryCode, stateObj.isoCode);
      setCities(stateCities);
      setFormData((prev) => ({
        ...prev,
        state: stateName,
        district: '',
      }));
    } else {
      setSelectedStateCode('');
      setCities([]);
      setFormData((prev) => ({
        ...prev,
        state: '',
        district: '',
      }));
    }
  };

  const handleCityChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      district: e.target.value,
    }));
  };

  const validateStep1 = () => {
    const { name, phone, alternatePhone, email, address, state, country, district, pinCode } = formData;

    if (!name || !phone || !email || !address || !state || !country || !district || !pinCode) {
      setError('Please fill in all required fields.');
      return false;
    }

    // Email validation
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return false;
    }

    // Phone validation (10 digits if India)
    if (selectedCountryCode === 'IN' && !/^\d{10}$/.test(phone)) {
      setError('Phone number must contain exactly 10 digits.');
      return false;
    }

    // Alt Phone validation (10 digits if provided and India)
    if (selectedCountryCode === 'IN' && alternatePhone) {
      if (!/^\d{10}$/.test(alternatePhone)) {
        setError('Alternate phone number must contain exactly 10 digits.');
        return false;
      }
      if (phone === alternatePhone) {
        setError('Alternate phone number cannot be the same as the primary phone number.');
        return false;
      }
    }

    // PIN code validation (6 digits if India)
    if (selectedCountryCode === 'IN' && !/^\d{6}$/.test(pinCode)) {
      setError('PIN Code must contain exactly 6 digits.');
      return false;
    }

    return true;
  };

  const nextStep = () => {
    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
      }
    }
  };

  const prevStep = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Save order to the database
      const orderPayload = {
        user: user?._id || null,
        ...formData,
        productId: product._id,
        quantity,
      };

      const { data } = await API.post('/orders', orderPayload);

      if (data.success) {
        setStep(3);
        const { order, ownerWhatsAppNumber } = data;

        // 2. Format the message for WhatsApp
        const waMessage = `*NEW ORDER PLACED* 🌿
------------------------
*Product:* ${order.product.name}
*Quantity:* ${order.quantity}
*Total Amount:* ₹${order.totalPrice}

*Customer Details:*
- Name: ${order.name}
- Phone: ${order.phone}
- Email: ${order.email}
${order.alternatePhone ? `- Alt Phone: ${order.alternatePhone}\n` : ''}
*Shipping Address:*
- Address: ${order.address}
${order.landmark ? `- Landmark: ${order.landmark}\n` : ''}- District: ${order.district}
- State: ${order.state}
- Country: ${order.country}
- PIN Code: ${order.pinCode}`;

        const encodedMessage = encodeURIComponent(waMessage);
        
        // 3. Open WhatsApp in new window after a brief delay
        setTimeout(() => {
          window.open(`https://wa.me/${ownerWhatsAppNumber}?text=${encodedMessage}`, '_blank');
          onClose();
        }, 2000);
      } else {
        setError('Failed to create order. Please try again.');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = product.price * quantity;

  return (
    <div className="modal-overlay">
      <div className="modal-container" style={{ maxWidth: '520px' }}>
        <button onClick={onClose} className="modal-close" aria-label="Close modal">
          <X size={22} />
        </button>

        <div className="modal-body" style={{ padding: '28px' }}>
          {/* Header */}
          <div className="modal-header">
            <h3 style={{ fontSize: '1.2rem' }}>Place Your Order</h3>
            <p style={{ fontSize: '0.82rem' }}>
              {step === 1 && 'Enter your contact and shipping details.'}
              {step === 2 && 'Review your order and confirm quantity.'}
              {step === 3 && 'Order submitted! Connecting to WhatsApp...'}
            </p>
          </div>

          {/* Step Indicators */}
          {step <= 2 && (
            <div className="order-steps" style={{ marginBottom: '20px' }}>
              <div className="order-step-item">
                <div className={`order-step-circle ${step >= 1 ? 'active' : ''} ${step > 1 ? 'done' : ''}`}>1</div>
                <div className={`order-step-line ${step > 1 ? 'done' : ''}`}></div>
              </div>
              <div className="order-step-item" style={{ flex: 'none' }}>
                <div className={`order-step-circle ${step >= 2 ? 'active' : ''}`}>2</div>
              </div>
            </div>
          )}

          {error && <div className="alert alert-danger" style={{ fontSize: '0.82rem', padding: '10px 14px' }}>{error}</div>}

          {/* Modal Steps content */}
          {step === 1 && (
            <div className="order-form">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="name" style={{ fontSize: '0.75rem' }}>Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="email" style={{ fontSize: '0.75rem' }}>Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label htmlFor="phone">Mobile Number (10 digits) *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="10-digit number"
                    maxLength={10}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="alternatePhone">Alternate Mobile (Optional)</label>
                  <input
                    type="tel"
                    id="alternatePhone"
                    name="alternatePhone"
                    value={formData.alternatePhone}
                    onChange={handleChange}
                    placeholder="10-digit number"
                    maxLength={10}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label htmlFor="address">Shipping Address *</label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Street name, house number, details..."
                  rows={2}
                  style={{ resize: 'none' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label htmlFor="landmark">Landmark</label>
                  <input
                    type="text"
                    id="landmark"
                    name="landmark"
                    value={formData.landmark}
                    onChange={handleChange}
                    placeholder="e.g. Near Post Office"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="pinCode">PIN / ZIP Code *</label>
                  <input
                    type="text"
                    id="pinCode"
                    name="pinCode"
                    value={formData.pinCode}
                    onChange={handleChange}
                    placeholder="Enter PIN code"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label htmlFor="country">Country *</label>
                  <select
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleCountryChange}
                    required
                  >
                    <option value="">Select Country</option>
                    {countries.map((c) => (
                      <option key={c.isoCode} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="state">State / Province *</label>
                  <select
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleStateChange}
                    required
                    disabled={!selectedCountryCode}
                  >
                    <option value="">Select State</option>
                    {states.map((s) => (
                      <option key={s.isoCode} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label htmlFor="district">District / City *</label>
                {cities.length > 0 ? (
                  <select
                    id="district"
                    name="district"
                    value={formData.district}
                    onChange={handleCityChange}
                    required
                    disabled={!selectedStateCode}
                  >
                    <option value="">Select City / District</option>
                    {cities.map((c, idx) => (
                      <option key={idx} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    id="district"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    placeholder="Enter city / district"
                    required
                    disabled={!selectedStateCode}
                  />
                )}
              </div>

              <button onClick={nextStep} className="btn btn-primary" style={{ width: '100%' }}>
                <span>Continue to Summary</span>
                <ArrowRight size={18} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="order-summary">
              {/* Product Info Card */}
              <div style={{ display: 'flex', gap: '16px', padding: '16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', marginBottom: '24px', backgroundColor: 'var(--card-bg)' }}>
                <img
                  src={product.images[0]}
                  alt={product.name}
                  style={{ width: '80px', height: '80px', objectFit: 'contain', backgroundColor: 'white', borderRadius: '6px', border: '1px solid var(--border-color)', padding: '4px' }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://placehold.co/100x100/f0f3ee/2f4f1e?text=Agadi';
                  }}
                />
                <div>
                  <h4 style={{ color: 'var(--primary-green)', marginBottom: '4px', fontSize: '1.05rem' }}>{product.name}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Ayurvedic Weight Gain Formulation</p>
                  <div style={{ fontWeight: '700', color: 'var(--primary-green)', marginTop: '8px' }}>₹{product.price} each</div>
                </div>
              </div>

              {/* Quantity Select */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <span style={{ fontWeight: '600' }}>Select Quantity:</span>
                <div className="qty-control">
                  <button type="button" onClick={() => handleQuantityChange(-1)} className="qty-btn" disabled={quantity <= 1}>-</button>
                  <span className="qty-val">{quantity}</span>
                  <button type="button" onClick={() => handleQuantityChange(1)} className="qty-btn">+</button>
                </div>
              </div>

              {/* Pricing breakdown */}
              <div style={{ borderTop: '1px dashed var(--border-color)', borderBottom: '1px dashed var(--border-color)', padding: '16px 0', marginBottom: '24px' }}>
                <div className="order-summary-row">
                  <span>Product Subtotal</span>
                  <span>₹{product.price} x {quantity}</span>
                </div>
                <div className="order-summary-row">
                  <span>Shipping Charges</span>
                  <span style={{ color: 'green', fontWeight: '500' }}>FREE</span>
                </div>
                <div className="order-summary-row order-summary-total">
                  <span>Total Amount</span>
                  <span>₹{totalPrice}</span>
                </div>
              </div>

              {/* Shipping Address Details */}
              <div style={{ marginBottom: '32px' }}>
                <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.5px' }}>Delivery Address</h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-color)', lineHeight: '1.5' }}>
                  <strong>{formData.name}</strong><br />
                  {formData.address}, {formData.landmark && `${formData.landmark}, `}{formData.district}, {formData.state} - {formData.pinCode}<br />
                  Phone: {formData.phone} {formData.alternatePhone && `| Alt: ${formData.alternatePhone}`}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <button onClick={prevStep} className="btn btn-outline" style={{ flexGrow: 1 }} disabled={loading}>
                  <ArrowLeft size={18} />
                  <span>Back</span>
                </button>
                <button onClick={handleSubmit} className="btn btn-primary" style={{ flexGrow: 2 }} disabled={loading}>
                  {loading ? (
                    <span>Processing...</span>
                  ) : (
                    <>
                      <Send size={18} />
                      <span>Place Order via WhatsApp</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ color: 'var(--primary-green)', marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
                <CheckCircle size={72} fill="rgba(47, 79, 30, 0.1)" />
              </div>
              <h4 style={{ fontSize: '1.4rem', color: 'var(--primary-green)', marginBottom: '12px' }}>Thank You for Your Order!</h4>
              <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 24px auto', fontSize: '0.95rem' }}>
                Your order details have been registered in our database. We are now opening WhatsApp to send the order details to our support team.
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', color: 'var(--secondary-green)', fontSize: '0.9rem' }}>
                <span className="spinner" style={{ width: '18px', height: '18px', border: '2px solid var(--secondary-green)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
                <span>Connecting to WhatsApp...</span>
              </div>
              <style>{`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderModal;
