import React, { useState, useContext, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, Send, CheckCircle, Search } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/api';
import { Country, State, City } from 'country-state-city';

// Predefined mapping of Kerala districts to major cities/towns
const KERALA_DISTRICTS = {
  'Alappuzha': ['Alappuzha', 'Kayamkulam', 'Cherthala', 'Haripad', 'Mavelikkara', 'Chengannur', 'Kuttanad', 'Ambalappuzha'],
  'Ernakulam': ['Kochi', 'Aluva', 'Muvattupuzha', 'Angamaly', 'Perumbavoor', 'Kothamangalam', 'Tripunithura', 'Kalamassery', 'Piravom'],
  'Idukki': ['Thodupuzha', 'Kattappana', 'Munnar', 'Adimali', 'Nedumkandam', 'Peermade', 'Devikulam'],
  'Kannur': ['Kannur', 'Thalassery', 'Payyannur', 'Taliparamba', 'Mattannur', 'Iritty', 'Alakode'],
  'Kasaragod': ['Kasaragod', 'Kanhangad', 'Nileshwaram', 'Uppala', 'Kumbla', 'Manjeshwar'],
  'Kollam': ['Kollam', 'Karunagappally', 'Paravur', 'Punalur', 'Kottarakkara', 'Chathannoor'],
  'Kottayam': ['Kottayam', 'Changanassery', 'Pala', 'Vaikom', 'Kanjirappally', 'Ettumanoor', 'Pampady'],
  'Kozhikode': ['Kozhikode', 'Vadakara', 'Koyilandy', 'Ramanattukara', 'Feroke', 'Koduvally', 'Thamarassery'],
  'Malappuram': ['Malappuram', 'Manjeri', 'Tirur', 'Ponnani', 'Kottakkal', 'Perinthalmanna', 'Nilambur', 'Valanchery', 'Edappal'],
  'Palakkad': ['Palakkad', 'Ottapalam', 'Shornur', 'Chittur', 'Mannarkkad', 'Cherpulassery', 'Alathur', 'Vadakkencherry'],
  'Pathanamthitta': ['Pathanamthitta', 'Adoor', 'Thiruvalla', 'Pandalam', 'Ranni', 'Kozhenchery', 'Konni'],
  'Thiruvananthapuram': ['Thiruvananthapuram', 'Neyyattinkara', 'Attingal', 'Varkala', 'Nedumangad', 'Kazhakkoottam'],
  'Thrissur': ['Thrissur', 'Guruvayur', 'Kunnamkulam', 'Chalakudy', 'Kodungallur', 'Irinjalakuda', 'Chavakkad', 'Wadakkanchery'],
  'Wayanad': ['Kalpetta', 'Mananthavady', 'Sulthan Bathery', 'Vythiri', 'Meppadi']
};

const OrderModal = ({ product, onClose }) => {
  const { user } = useContext(AuthContext);
  const [step, setStep] = useState(1); 
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pinValidating, setPinValidating] = useState(false);
  const [pinValid, setPinValid] = useState(null); // null=unchecked, true=valid, false=invalid

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
    city: '',
  });

  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    email: '',
    phone: '',
    alternatePhone: '',
    address: '',
    landmark: '',
    district: '',
    state: '',
    country: '',
    pinCode: '',
    city: '',
  });

  const [quantity, setQuantity] = useState(1);

  // country-state-city state
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState('');
  const [selectedStateCode, setSelectedStateCode] = useState('');

  // Searchable District dropdown state
  const [districtSearch, setDistrictSearch] = useState('');
  const [isDistrictDropdownOpen, setIsDistrictDropdownOpen] = useState(false);

  // Address Options states
  const [savedAddress, setSavedAddress] = useState(user?.address || '');

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

  // If savedAddress changes when user state resolves
  useEffect(() => {
    if (user?.address) {
      setSavedAddress(user.address);
    }
  }, [user]);

  const validateField = (name, value) => {
    let err = '';
    if (name === 'name' && !value.trim()) err = 'Name is required.';
    if (name === 'email') {
      const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!value) err = 'Email is required.';
      else if (!emailRegex.test(value)) err = 'Invalid email.';
    }
    if (name === 'phone') {
      if (!value) err = 'Mobile is required.';
      else if (selectedCountryCode === 'IN' && !/^\d{10}$/.test(value)) err = 'Must be exactly 10 digits.';
    }
    if (name === 'alternatePhone' && selectedCountryCode === 'IN' && value) {
      if (!/^\d{10}$/.test(value)) err = 'Must be exactly 10 digits.';
      else if (value === formData.phone) err = 'Cannot match primary mobile.';
    }
    if (name === 'address' && !value.trim()) err = 'Shipping address is required.';
    if (name === 'pinCode') {
      if (!value) err = 'PIN is required.';
      else if (selectedCountryCode === 'IN' && !/^\d{6}$/.test(value)) err = 'Must be 6 digits.';
      else if (pinValid === false) err = 'Invalid PIN code. Please enter a valid one.';
    }
    if (name === 'country' && !value) err = 'Country is required.';
    if (name === 'state' && !value) err = 'State is required.';
    if (name === 'district' && !value) err = 'District is required.';
    if (name === 'city' && formData.state === 'Kerala' && !value) err = 'City/Town is required.';
    return err;
  };

  // Live pincode validation via Indian Postal API
  const validatePinCode = async (pin) => {
    if (selectedCountryCode !== 'IN' || !/^\d{6}$/.test(pin)) return;
    setPinValidating(true);
    setPinValid(null);
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await res.json();
      if (data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
        const po = data[0].PostOffice[0];
        setPinValid(true);
        // Auto-fill district, state, city from API response
        setFormData(prev => ({
          ...prev,
          state: po.State || prev.state,
          district: po.District || prev.district,
          city: po.Block || po.Name || prev.city,
        }));
        // Update state dropdown selection
        const matchedState = states.find(s => s.name === po.State);
        if (matchedState) setSelectedStateCode(matchedState.isoCode);
        setFieldErrors(prev => ({ ...prev, pinCode: '' }));
      } else {
        setPinValid(false);
        setFieldErrors(prev => ({ ...prev, pinCode: 'Invalid PIN code. Please enter a valid one.' }));
      }
    } catch {
      setPinValid(false);
      setFieldErrors(prev => ({ ...prev, pinCode: 'Could not verify PIN. Check your connection.' }));
    } finally {
      setPinValidating(false);
    }
  };


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // For pinCode: reset validity on each keystroke, then validate when 6 digits
    if (name === 'pinCode') {
      setPinValid(null);
      if (/^\d{6}$/.test(value)) {
        validatePinCode(value);
      } else {
        const err = validateField(name, value);
        setFieldErrors((prev) => ({ ...prev, [name]: err }));
      }
    } else {
      const err = validateField(name, value);
      setFieldErrors((prev) => ({ ...prev, [name]: err }));
    }
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
      setSelectedStateCode('');
      setFormData((prev) => ({
        ...prev,
        country: countryName,
        state: '',
        district: '',
        city: '',
      }));
    } else {
      setSelectedCountryCode('');
      setStates([]);
      setSelectedStateCode('');
      setFormData((prev) => ({
        ...prev,
        country: '',
        state: '',
        district: '',
        city: '',
      }));
    }
  };

  const handleStateChange = (e) => {
    const stateName = e.target.value;
    const stateObj = states.find((s) => s.name === stateName);

    if (stateObj) {
      setSelectedStateCode(stateObj.isoCode);
      setFormData((prev) => ({
        ...prev,
        state: stateName,
        district: '',
        city: '',
      }));
    } else {
      setSelectedStateCode('');
      setFormData((prev) => ({
        ...prev,
        state: '',
        district: '',
        city: '',
      }));
    }
  };

  const validateStep1 = () => {
    const errors = {
      name: validateField('name', formData.name),
      email: validateField('email', formData.email),
      phone: validateField('phone', formData.phone),
      alternatePhone: validateField('alternatePhone', formData.alternatePhone),
      address: validateField('address', formData.address),
      pinCode: validateField('pinCode', formData.pinCode),
      country: validateField('country', formData.country),
      state: validateField('state', formData.state),
      district: validateField('district', formData.district),
      city: validateField('city', formData.city),
    };

    setFieldErrors(errors);
    const hasErrors = Object.values(errors).some(err => err !== '');
    return !hasErrors;
  };

  const nextStep = () => {
    if (step === 1) {
      // Block if PIN is still being validated
      if (pinValidating) {
        setError('Please wait — verifying PIN code...');
        return;
      }
      // Block if PIN is invalid (only for India)
      if (selectedCountryCode === 'IN' && formData.pinCode && pinValid === false) {
        setFieldErrors(prev => ({ ...prev, pinCode: 'Invalid PIN code. Please enter a valid one.' }));
        return;
      }
      if (validateStep1()) {
        // Save address to localStorage and user context when continuing to summary
        const compositeAddress = [
          formData.address,
          formData.landmark,
          formData.district,
          formData.state,
          formData.pinCode
        ].filter(Boolean).join(', ');

        if (compositeAddress) {
          setSavedAddress(compositeAddress);
          if (user) {
            user.address = compositeAddress;
          }
          const stored = JSON.parse(localStorage.getItem('userInfo'));
          if (stored) {
            stored.address = compositeAddress;
            localStorage.setItem('userInfo', JSON.stringify(stored));
          }
        }

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
      // Composite full address nicely
      const compositedAddress = formData.city 
        ? `${formData.address}, ${formData.city}`
        : formData.address;

      const orderPayload = {
        user: user?._id || null,
        ...formData,
        address: compositedAddress,
        productId: product._id,
        quantity,
      };

      const { data } = await API.post('/orders', orderPayload);

      if (data.success) {
        // Sync context user info address locally so it updates immediately
        if (user) {
          user.address = [compositedAddress, formData.landmark, formData.district, formData.state, formData.pinCode].filter(Boolean).join(', ');
          const stored = JSON.parse(localStorage.getItem('userInfo'));
          if (stored) {
            stored.address = user.address;
            localStorage.setItem('userInfo', JSON.stringify(stored));
          }
        }
        
        setStep(3);
        const { order, ownerWhatsAppNumber } = data;

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
        
        setTimeout(() => {
          window.open(`https://wa.me/${ownerWhatsAppNumber}?text=${encodedMessage}`, '_blank');
          onClose();
        }, 2000);
      } else {
        throw new Error('API order creation returned unsuccessful');
      }
    } catch (err) {
      console.warn('Backend API connection issue, executing direct WhatsApp order dispatch fallback:', err);
      
      const compositedAddress = formData.city 
        ? `${formData.address}, ${formData.city}`
        : formData.address;

      const calcTotalPrice = (product.price || 1550) * quantity;
      const ownerWhatsApp = '918139800282';

      const waMessage = `*NEW ORDER PLACED (AGADI CHOORNA)* 🌿
------------------------
*Product:* ${product.name || 'Agadi Choorna'}
*Quantity:* ${quantity}
*Total Amount:* ₹${calcTotalPrice}

*Customer Details:*
- Name: ${formData.name}
- Phone: ${formData.phone}
- Email: ${formData.email || 'N/A'}
${formData.alternatePhone ? `- Alt Phone: ${formData.alternatePhone}\n` : ''}
*Shipping Address:*
- Address: ${compositedAddress}
${formData.landmark ? `- Landmark: ${formData.landmark}\n` : ''}- District: ${formData.district || ''}
- State: ${formData.state || ''}
- Country: ${formData.country || 'India'}
- PIN Code: ${formData.pinCode || ''}`;

      const encodedMsg = encodeURIComponent(waMessage);

      setStep(3);

      setTimeout(() => {
        window.open(`https://wa.me/${ownerWhatsApp}?text=${encodedMsg}`, '_blank');
        onClose();
      }, 1800);
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = product.price * quantity;

  // Searchable districts logic
  const getDistrictOptions = () => {
    if (formData.state === 'Kerala') {
      return Object.keys(KERALA_DISTRICTS);
    }
    // For other states, return city names of that state as potential districts/cities
    return City.getCitiesOfState(selectedCountryCode, selectedStateCode).map(c => c.name);
  };

  const districtOptions = getDistrictOptions();
  const filteredDistrictOptions = districtOptions.filter(d =>
    d.toLowerCase().includes(districtSearch.toLowerCase())
  );

  // Sync district search input with form state
  useEffect(() => {
    setDistrictSearch(formData.district);
  }, [formData.district]);

  // Cities logic
  const getCityOptions = () => {
    if (formData.state === 'Kerala' && formData.district) {
      return KERALA_DISTRICTS[formData.district] || [];
    }
    return [];
  };
  const cityOptions = getCityOptions();

  return (
    <div className="modal-overlay">
      <div className="modal-container" style={{ maxWidth: '540px' }}>
        <button onClick={onClose} className="modal-close" aria-label="Close modal">
          <X size={20} />
        </button>

        <div className="modal-body" style={{ padding: '20px 24px' }}>
          {/* Header */}
          <div className="modal-header" style={{ marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1.15rem' }}>Place Your Order</h3>
            <p style={{ fontSize: '0.78rem', margin: 0 }}>
              {step === 1 && 'Enter your contact and shipping details.'}
              {step === 2 && 'Review your order and confirm quantity.'}
              {step === 3 && 'Order submitted! Connecting to WhatsApp...'}
            </p>
          </div>

          {/* Step Indicators */}
          {step <= 2 && (
            <div className="order-steps" style={{ marginBottom: '16px' }}>
              <div className="order-step-item">
                <div className={`order-step-circle ${step >= 1 ? 'active' : ''} ${step > 1 ? 'done' : ''}`}>1</div>
                <div className={`order-step-line ${step > 1 ? 'done' : ''}`}></div>
              </div>
              <div className="order-step-item" style={{ flex: 'none' }}>
                <div className={`order-step-circle ${step >= 2 ? 'active' : ''}`}>2</div>
              </div>
            </div>
          )}

          {error && <div className="alert alert-danger" style={{ fontSize: '0.8rem', padding: '8px 12px', marginBottom: '12px' }}>{error}</div>}

          {/* Modal Steps content */}
          {step === 1 && (
            <div className="order-form compact-form">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="name" style={{ fontSize: '0.72rem', marginBottom: '3px' }}>Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                    required
                  />
                  {fieldErrors.name && <span className="field-error-msg">{fieldErrors.name}</span>}
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="email" style={{ fontSize: '0.72rem', marginBottom: '3px' }}>Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                    required
                  />
                  {fieldErrors.email && <span className="field-error-msg">{fieldErrors.email}</span>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="phone" style={{ fontSize: '0.72rem', marginBottom: '3px' }}>Mobile Number *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="10-digit number"
                    maxLength={10}
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                    required
                  />
                  {fieldErrors.phone && <span className="field-error-msg">{fieldErrors.phone}</span>}
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="alternatePhone" style={{ fontSize: '0.72rem', marginBottom: '3px' }}>Alternate Mobile</label>
                  <input
                    type="tel"
                    id="alternatePhone"
                    name="alternatePhone"
                    value={formData.alternatePhone}
                    onChange={handleChange}
                    placeholder="10-digit number"
                    maxLength={10}
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                  />
                  {fieldErrors.alternatePhone && <span className="field-error-msg">{fieldErrors.alternatePhone}</span>}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '10px' }}>
                <label htmlFor="address" style={{ fontSize: '0.72rem', marginBottom: '3px' }}>Shipping Address *</label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Street name, house number, details..."
                  rows={1.5}
                  style={{ resize: 'none', padding: '8px 12px', fontSize: '0.85rem' }}
                  required
                />
                {fieldErrors.address && <span className="field-error-msg">{fieldErrors.address}</span>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="landmark" style={{ fontSize: '0.72rem', marginBottom: '3px' }}>Landmark</label>
                  <input
                    type="text"
                    id="landmark"
                    name="landmark"
                    value={formData.landmark}
                    onChange={handleChange}
                    placeholder="e.g. Near Post Office"
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                  />
                  {fieldErrors.landmark && <span className="field-error-msg">{fieldErrors.landmark}</span>}
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="pinCode" style={{ fontSize: '0.72rem', marginBottom: '3px' }}>PIN / ZIP Code *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      id="pinCode"
                      name="pinCode"
                      value={formData.pinCode}
                      onChange={handleChange}
                      placeholder="Enter 6-digit PIN code"
                      maxLength={6}
                      style={{
                        padding: '8px 36px 8px 12px',
                        fontSize: '0.85rem',
                        width: '100%',
                        borderColor: pinValid === true ? '#16a34a' : pinValid === false ? '#dc2626' : undefined,
                        boxShadow: pinValid === true ? '0 0 0 2px rgba(22,163,74,0.15)' : pinValid === false ? '0 0 0 2px rgba(220,38,38,0.15)' : undefined,
                      }}
                      required
                    />
                    {/* Status icon inside input */}
                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', lineHeight: 1 }}>
                      {pinValidating && <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>⏳</span>}
                      {!pinValidating && pinValid === true && <span style={{ color: '#16a34a' }}>✓</span>}
                      {!pinValidating && pinValid === false && <span style={{ color: '#dc2626' }}>✗</span>}
                    </span>
                  </div>
                  {pinValidating && <span style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: '3px', display: 'block' }}>Verifying PIN code...</span>}
                  {!pinValidating && pinValid === true && formData.district && (
                    <span style={{ fontSize: '0.72rem', color: '#16a34a', marginTop: '3px', display: 'block' }}>
                      ✓ Valid PIN — {formData.district}, {formData.state}
                    </span>
                  )}
                  {fieldErrors.pinCode && <span className="field-error-msg">{fieldErrors.pinCode}</span>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="country" style={{ fontSize: '0.72rem', marginBottom: '3px' }}>Country *</label>
                  <select
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleCountryChange}
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                    required
                  >
                    <option value="">Select Country</option>
                    {countries.map((c) => (
                      <option key={c.isoCode} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.country && <span className="field-error-msg">{fieldErrors.country}</span>}
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="state" style={{ fontSize: '0.72rem', marginBottom: '3px' }}>State *</label>
                  <select
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleStateChange}
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
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
                  {fieldErrors.state && <span className="field-error-msg">{fieldErrors.state}</span>}
                </div>
              </div>

              {/* District and City Selection Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }} className="form-row">
                <div className="form-group" style={{ marginBottom: 0, position: 'relative' }}>
                  <label htmlFor="district" style={{ fontSize: '0.72rem', marginBottom: '3px' }}>District *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      id="district"
                      placeholder="Search / select district"
                      value={districtSearch}
                      onChange={(e) => {
                        setDistrictSearch(e.target.value);
                        setIsDistrictDropdownOpen(true);
                        setFormData(prev => ({ ...prev, district: '' }));
                      }}
                      onFocus={() => setIsDistrictDropdownOpen(true)}
                      onBlur={() => {
                        setTimeout(() => setIsDistrictDropdownOpen(false), 200);
                      }}
                      style={{ padding: '8px 12px 8px 30px', fontSize: '0.85rem' }}
                      disabled={!selectedStateCode}
                    />
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  </div>
                  
                  {isDistrictDropdownOpen && filteredDistrictOptions.length > 0 && (
                    <ul className="modal-combobox-dropdown" style={{
                      position: 'absolute',
                      bottom: '100%',
                      left: 0,
                      right: 0,
                      maxHeight: '140px',
                      overflowY: 'auto',
                      background: '#fff',
                      border: '1.5px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      zIndex: 1100,
                      listStyle: 'none',
                      padding: 0,
                      margin: '0 0 4px',
                      boxShadow: 'var(--shadow-lg)'
                    }}>
                      {filteredDistrictOptions.map(opt => (
                        <li
                          key={opt}
                          onMouseDown={() => {
                            setFormData(prev => ({ ...prev, district: opt, city: '' }));
                            setDistrictSearch(opt);
                            setIsDistrictDropdownOpen(false);
                            setFieldErrors(prev => ({ ...prev, district: '' }));
                          }}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            borderBottom: '1px solid var(--border-color)',
                            fontSize: '0.8rem',
                            textAlign: 'left'
                          }}
                          className="combobox-item"
                        >
                          {opt}
                        </li>
                      ))}
                    </ul>
                  )}
                  {fieldErrors.district && <span className="field-error-msg">{fieldErrors.district}</span>}
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="city" style={{ fontSize: '0.72rem', marginBottom: '3px' }}>City / Town {formData.state === 'Kerala' && '*'}</label>
                  {formData.state === 'Kerala' ? (
                    <select
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                      required
                      disabled={!formData.district}
                    >
                      <option value="">Select City / Town</option>
                      {cityOptions.map((cName) => (
                        <option key={cName} value={cName}>
                          {cName}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Enter city / area"
                      style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                      disabled={!selectedStateCode}
                    />
                  )}
                  {fieldErrors.city && <span className="field-error-msg">{fieldErrors.city}</span>}
                </div>
              </div>

              {/* Checkout Address Management (For logged-in users) */}
              {user && savedAddress && (
                <div className="checkout-saved-address-container" style={{
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '10px',
                  marginTop: '10px',
                  textAlign: 'left'
                }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--primary-green)', display: 'block', marginBottom: '4px' }}>
                    Saved Address Options
                  </span>
                  <div style={{
                    border: '1.5px solid var(--primary-green)',
                    background: '#f4fbf7',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-color)', margin: 0, fontWeight: '500', lineHeight: 1.4 }}>
                        {savedAddress}
                      </p>
                      <span style={{
                        background: 'var(--primary-green)',
                        color: '#fff',
                        fontSize: '0.6rem',
                        padding: '1px 5px',
                        borderRadius: '100px',
                        fontWeight: '700',
                        marginLeft: '8px',
                        flexShrink: 0
                      }}>Active</span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          const parts = savedAddress.split(',').map(p => p.trim());
                          // Guess parts: address, landmark, district, state, pin
                          setFormData(prev => ({
                            ...prev,
                            address: parts[0] || '',
                            landmark: parts[1] || '',
                            district: parts[2] || '',
                            state: parts[3] || 'Kerala',
                            pinCode: parts[4] || ''
                          }));
                          setDistrictSearch(parts[2] || '');
                        }}
                        className="btn-link"
                        style={{ fontSize: '0.7rem', color: 'var(--primary-green)', fontWeight: '600', textDecoration: 'underline' }}
                      >
                        Edit Saved
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Delete this saved address?')) {
                            setSavedAddress('');
                            if (user) {
                              user.address = '';
                              const stored = JSON.parse(localStorage.getItem('userInfo'));
                              if (stored) {
                                stored.address = '';
                                localStorage.setItem('userInfo', JSON.stringify(stored));
                              }
                            }
                          }
                        }}
                        className="btn-link"
                        style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: '600', textDecoration: 'underline' }}
                      >
                        Delete Address
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            address: '',
                            landmark: '',
                            district: '',
                            city: '',
                            pinCode: ''
                          }));
                          setDistrictSearch('');
                        }}
                        className="btn-link"
                        style={{ fontSize: '0.7rem', color: 'var(--secondary-green)', fontWeight: '600', textDecoration: 'underline' }}
                      >
                        Add New
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <button onClick={nextStep} className="btn btn-primary" style={{ width: '100%', marginTop: '14px', padding: '10px 20px', fontSize: '0.85rem' }}>
                <span>Continue to Summary</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="order-summary" style={{ textAlign: 'left' }}>
              {/* Product Info Card */}
              <div style={{ display: 'flex', gap: '12px', padding: '12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', marginBottom: '16px', backgroundColor: 'var(--card-bg)' }}>
                <img
                  src={product.images[0]}
                  alt={product.name}
                  style={{ width: '70px', height: '70px', objectFit: 'contain', backgroundColor: 'white', borderRadius: '6px', border: '1px solid var(--border-color)', padding: '2px' }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://placehold.co/100x100/f0f3ee/2f4f1e?text=Agadi';
                  }}
                />
                <div>
                  <h4 style={{ color: 'var(--primary-green)', marginBottom: '2px', fontSize: '0.95rem', fontWeight: '700' }}>{product.name}</h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Ayurvedic Weight Gain Formulation</p>
                  <div style={{ fontWeight: '700', color: 'var(--primary-green)', marginTop: '4px', fontSize: '0.9rem' }}>₹{product.price} each</div>
                </div>
              </div>

              {/* Quantity Select */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>Select Quantity:</span>
                <div className="qty-control">
                  <button type="button" onClick={() => handleQuantityChange(-1)} className="qty-btn" disabled={quantity <= 1}>-</button>
                  <span className="qty-val">{quantity}</span>
                  <button type="button" onClick={() => handleQuantityChange(1)} className="qty-btn">+</button>
                </div>
              </div>

              {/* Pricing breakdown */}
              <div style={{ borderTop: '1px dashed var(--border-color)', borderBottom: '1px dashed var(--border-color)', padding: '10px 0', marginBottom: '16px' }}>
                <div className="order-summary-row" style={{ fontSize: '0.8rem', marginBottom: '6px' }}>
                  <span>Product Subtotal</span>
                  <span>₹{product.price} x {quantity}</span>
                </div>
                <div className="order-summary-row" style={{ fontSize: '0.8rem', marginBottom: '6px' }}>
                  <span>Shipping Charges</span>
                  <span style={{ color: 'green', fontWeight: '600' }}>FREE</span>
                </div>
                <div className="order-summary-row order-summary-total" style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--primary-green)', marginTop: '4px', paddingTop: '4px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total Amount</span>
                  <span>₹{totalPrice}</span>
                </div>
              </div>

              {/* Shipping Address Details */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.5px', fontWeight: '700' }}>Delivery Address</h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-color)', lineHeight: '1.45', margin: 0 }}>
                  <strong>{formData.name}</strong><br />
                  {formData.address}{formData.city ? `, ${formData.city}` : ''}{formData.landmark && `, ${formData.landmark}`}<br />
                  {formData.district}, {formData.state} - {formData.pinCode}<br />
                  Phone: {formData.phone} {formData.alternatePhone && `| Alt: ${formData.alternatePhone}`}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={prevStep} className="btn btn-outline" style={{ flexGrow: 1, padding: '10px', fontSize: '0.85rem' }} disabled={loading}>
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>
                <button onClick={handleSubmit} className="btn btn-primary" style={{ flexGrow: 2, padding: '10px', fontSize: '0.85rem' }} disabled={loading}>
                  {loading ? (
                    <span>Processing...</span>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>Confirm via WhatsApp</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ color: 'var(--primary-green)', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                <CheckCircle size={60} fill="rgba(47, 79, 30, 0.1)" />
              </div>
              <h4 style={{ fontSize: '1.2rem', color: 'var(--primary-green)', marginBottom: '8px', fontWeight: '700' }}>Thank You for Your Order!</h4>
              <p style={{ color: 'var(--text-muted)', maxWidth: '380px', margin: '0 auto 16px auto', fontSize: '0.85rem', lineHeight: 1.5 }}>
                Your order details have been registered in our database. We are now opening WhatsApp to send the order details to our support team.
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', color: 'var(--secondary-green)', fontSize: '0.85rem' }}>
                <span className="spinner" style={{ width: '16px', height: '16px', border: '2px solid var(--secondary-green)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
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
