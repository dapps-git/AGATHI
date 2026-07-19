import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Shield, FileText, RefreshCcw, Truck, ChevronRight } from 'lucide-react';

const tabs = [
  { id: 'privacy',  label: 'Privacy Policy',          icon: Shield },
  { id: 'terms',    label: 'Terms & Conditions',       icon: FileText },
  { id: 'refund',   label: 'Refund & Cancellation',    icon: RefreshCcw },
  { id: 'shipping', label: 'Shipping & Delivery',      icon: Truck },
];

const Policies = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('privacy');

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (tabs.find(t => t.id === hash)) setActiveTab(hash);
    else setActiveTab('privacy');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.hash]);

  const switchTab = (id) => {
    setActiveTab(id);
    navigate(`/policies#${id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)', paddingTop: '88px' }}>
      {/* Page Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1a2c11 0%, var(--primary-green) 100%)',
        color: '#fff',
        padding: '48px 24px 56px',
        textAlign: 'center',
      }}>
        <span className="section-eyebrow" style={{ color: 'rgba(255,255,255,0.6)' }}>Legal</span>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '12px', color: '#fff' }}>
          Policies &amp; Terms
        </h1>
        <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.72)', maxWidth: '520px', margin: '0 auto' }}>
          We are committed to transparency. Please read our policies before placing an order.
        </p>
      </div>

      <div className="container" style={{ maxWidth: '920px', padding: '0 24px 80px' }}>
        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          margin: '-28px 0 40px',
          justifyContent: 'center',
        }}>
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => switchTab(id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '10px 20px',
                borderRadius: '100px',
                border: activeTab === id ? 'none' : '1.5px solid var(--border-color)',
                background: activeTab === id ? 'var(--primary-green)' : '#fff',
                color: activeTab === id ? '#fff' : 'var(--text-muted)',
                fontWeight: activeTab === id ? 600 : 500,
                fontSize: '0.82rem',
                cursor: 'pointer',
                boxShadow: activeTab === id ? '0 4px 14px rgba(47,79,30,0.25)' : 'var(--shadow-sm)',
                transition: 'all 0.2s',
              }}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{
          background: '#fff',
          border: '1px solid var(--border-color)',
          borderRadius: '20px',
          padding: '48px',
          boxShadow: 'var(--shadow-md)',
          lineHeight: 1.8,
        }}>

          {/* ─── Privacy Policy ─── */}
          {activeTab === 'privacy' && (
            <PolicyContent title="Privacy Policy" updated="19 July 2025">
              <Section title="1. Introduction">
                <p>Agadi Choorna ("we", "us", or "our") respects your privacy. This Privacy Policy explains how we collect, use, and protect your personal information when you visit our website <strong>www.agadichoornam.com</strong> or place an order with us.</p>
              </Section>
              <Section title="2. Information We Collect">
                <p>When you place an order or register on our website, we may collect:</p>
                <ul>
                  <li><strong>Full Name</strong> – for order identification and delivery.</li>
                  <li><strong>Phone Number</strong> – to contact you regarding your order via WhatsApp or phone call.</li>
                  <li><strong>Email Address</strong> – for order confirmations and support.</li>
                  <li><strong>Shipping Address</strong> – for delivery purposes.</li>
                </ul>
                <p>We do <strong>not</strong> collect payment card details directly. All payment-related information is handled securely through trusted third-party payment processors.</p>
              </Section>
              <Section title="3. How We Use Your Information">
                <p>We use the information collected solely for:</p>
                <ul>
                  <li>Processing and delivering your orders.</li>
                  <li>Communicating order updates and support queries.</li>
                  <li>Improving our products and website experience.</li>
                </ul>
              </Section>
              <Section title="4. Data Sharing">
                <p>We do <strong>not</strong> sell, trade, or rent your personal information to third parties. We may share information with trusted delivery partners solely for order fulfilment purposes, bound by confidentiality obligations.</p>
              </Section>
              <Section title="5. Data Security">
                <p>We implement industry-standard security measures to protect your personal data from unauthorised access, alteration, disclosure, or destruction. All data transmissions on our website are secured via HTTPS/SSL encryption.</p>
              </Section>
              <Section title="6. Your Rights">
                <p>You may request access to, correction of, or deletion of your personal data at any time by contacting us at <strong>agadichoornam@gmail.com</strong>.</p>
              </Section>
              <Section title="7. Changes to This Policy">
                <p>We may update this Privacy Policy periodically. Continued use of our website after any changes constitutes acceptance of the revised policy.</p>
              </Section>
              <Section title="8. Contact Us">
                <p>For any privacy-related concerns, please contact us at:<br /><strong>Email:</strong> agadichoornam@gmail.com<br /><strong>Phone:</strong> +91 9072888825</p>
              </Section>
            </PolicyContent>
          )}

          {/* ─── Terms & Conditions ─── */}
          {activeTab === 'terms' && (
            <PolicyContent title="Terms & Conditions" updated="19 July 2025">
              <Section title="1. Acceptance of Terms">
                <p>By accessing or using the website <strong>www.agadichoornam.com</strong> or purchasing our products, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our website.</p>
              </Section>
              <Section title="2. About Our Products">
                <p>Agadi Choorna is a traditional Ayurvedic herbal formulation. Our products are:</p>
                <ul>
                  <li>Based on traditional Ayurvedic knowledge.</li>
                  <li>Intended to support healthy weight management and digestion as part of a balanced lifestyle.</li>
                  <li>Not a substitute for professional medical advice, diagnosis, or treatment.</li>
                </ul>
                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '10px',
                  padding: '16px 20px',
                  margin: '16px 0',
                  fontSize: '0.875rem',
                  color: '#166534',
                }}>
                  <strong>Important Disclaimer:</strong> Results may vary from person to person. This product is a traditional Ayurvedic formulation and is not intended to diagnose, treat, cure, or prevent any disease. If you have a medical condition or are on medication, please consult a qualified healthcare professional before use.
                </div>
              </Section>
              <Section title="3. Pricing">
                <p>All prices displayed on our website are in Indian Rupees (₹) and are inclusive of applicable taxes. We reserve the right to change prices at any time without prior notice. The price at the time of order placement shall apply to that order.</p>
              </Section>
              <Section title="4. Order Placement">
                <p>Orders are placed by submitting the order form on our website. After placing an order, you will be redirected to WhatsApp to confirm your order with our team. An order is confirmed only after our team acknowledges it.</p>
                <p>We reserve the right to cancel any order in cases of product unavailability, pricing errors, or suspected fraud. You will be notified and fully refunded in such cases.</p>
              </Section>
              <Section title="5. Accuracy of Information">
                <p>You are responsible for providing accurate shipping and contact information. We are not liable for delivery failures or delays caused by incorrect information provided by you.</p>
              </Section>
              <Section title="6. Intellectual Property">
                <p>All content on this website including text, images, logo, and branding is the intellectual property of Agadi Choorna. Unauthorised reproduction, distribution, or use of our content is strictly prohibited.</p>
              </Section>
              <Section title="7. Limitation of Liability">
                <p>Agadi Choorna shall not be liable for any indirect, incidental, or consequential damages arising from the use of our products or website. Our total liability shall not exceed the amount paid for the specific product order in question.</p>
              </Section>
              <Section title="8. Governing Law">
                <p>These Terms and Conditions are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Kerala, India.</p>
              </Section>
              <Section title="9. Contact Us">
                <p>For any queries regarding these terms, please contact:<br /><strong>Email:</strong> agadichoornam@gmail.com<br /><strong>Phone:</strong> +91 9072888825</p>
              </Section>
            </PolicyContent>
          )}

          {/* ─── Refund Policy ─── */}
          {activeTab === 'refund' && (
            <PolicyContent title="Refund & Cancellation Policy" updated="19 July 2025">
              <Section title="1. Nature of Our Products">
                <p>Agadi Choorna is an Ayurvedic consumable health product. Due to hygiene and safety reasons, <strong>opened or used products cannot be returned or exchanged</strong> under any circumstances.</p>
              </Section>
              <Section title="2. Eligibility for Refund">
                <p>A refund or replacement may be considered in the following cases:</p>
                <ul>
                  <li>You received a <strong>damaged product</strong> (visibly damaged packaging or tampered seal).</li>
                  <li>You received the <strong>wrong product</strong> different from what was ordered.</li>
                  <li>The product was <strong>not delivered</strong> within the expected timeframe due to a courier failure.</li>
                </ul>
              </Section>
              <Section title="3. How to Raise a Complaint">
                <p>To raise a complaint, please:</p>
                <ul>
                  <li>Contact us within <strong>48 hours</strong> of delivery.</li>
                  <li>WhatsApp us at <strong>+91 9072888825</strong> with your order details and clear photographs of the damaged or incorrect product.</li>
                </ul>
                <p>Complaints raised after 48 hours of delivery will not be entertained.</p>
              </Section>
              <Section title="4. Refund Process">
                <p>Once your complaint is reviewed and approved:</p>
                <ul>
                  <li>A replacement product will be dispatched, <strong>or</strong></li>
                  <li>A refund will be processed to your original payment method.</li>
                </ul>
                <p>Approved refunds are typically processed within <strong>7–10 business days</strong>, depending on your bank or payment provider.</p>
              </Section>
              <Section title="5. Order Cancellation">
                <p>Orders may be cancelled before they are dispatched. Once dispatched, cancellation is not possible. To cancel an order, contact us immediately via WhatsApp at <strong>+91 9072888825</strong> with your order details.</p>
              </Section>
              <Section title="6. Non-Refundable Situations">
                <p>Refunds will <strong>not</strong> be provided in the following situations:</p>
                <ul>
                  <li>Change of mind after opening the product.</li>
                  <li>Dissatisfaction with results (as results vary from person to person).</li>
                  <li>Incorrect address provided by the customer leading to delivery failure.</li>
                  <li>Delay caused by external factors beyond our control (e.g., natural disasters, courier delays).</li>
                </ul>
              </Section>
              <Section title="7. Contact Us">
                <p>For refund or cancellation requests:<br /><strong>WhatsApp / Phone:</strong> +91 9072888825<br /><strong>Email:</strong> agadichoornam@gmail.com</p>
              </Section>
            </PolicyContent>
          )}

          {/* ─── Shipping Policy ─── */}
          {activeTab === 'shipping' && (
            <PolicyContent title="Shipping & Delivery Policy" updated="19 July 2025">
              <Section title="1. Order Processing">
                <p>All orders are processed within <strong>1–2 business days</strong> after order confirmation. Orders are not processed on Sundays and public holidays.</p>
                <p>You will be contacted on WhatsApp by our team to confirm your order before dispatch.</p>
              </Section>
              <Section title="2. Delivery Timeframe">
                <p>Standard delivery takes approximately <strong>3–7 business days</strong> from the date of dispatch, depending on your location within India. Delivery timelines may vary during peak seasons, festivals, or due to factors beyond our control.</p>
              </Section>
              <Section title="3. Delivery Areas">
                <p>We currently deliver <strong>across India</strong>. Certain remote areas may experience longer delivery times. If we are unable to deliver to your location, we will inform you promptly and process a full refund.</p>
              </Section>
              <Section title="4. Shipping Charges">
                <p>Any applicable shipping charges will be communicated to you before order confirmation. We aim to offer free or minimal shipping charges where possible.</p>
              </Section>
              <Section title="5. Tracking Your Order">
                <p>Once your order is dispatched, tracking information (if available through our courier partner) will be shared with you via WhatsApp. You may also contact us to inquire about your order status.</p>
              </Section>
              <Section title="6. Delivery Failures">
                <p>If a delivery attempt fails due to an incorrect address or recipient unavailability, the courier may attempt re-delivery. If delivery is not possible after attempts, the parcel may be returned to us. In such cases, re-shipping charges may apply.</p>
                <p>Please ensure your shipping address and contact number are accurate at the time of ordering.</p>
              </Section>
              <Section title="7. Damaged in Transit">
                <p>If your product arrives visibly damaged, please contact us within <strong>48 hours</strong> of delivery with photographs. We will arrange a replacement or refund as per our Refund Policy.</p>
              </Section>
              <Section title="8. Contact Us">
                <p>For shipping-related queries:<br /><strong>WhatsApp / Phone:</strong> +91 9072888825<br /><strong>Email:</strong> agadichoornam@gmail.com</p>
              </Section>
            </PolicyContent>
          )}
        </div>

        {/* Quick Links to other policies */}
        <div style={{ marginTop: '32px' }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px', textAlign: 'center' }}>Also read:</p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {tabs.filter(t => t.id !== activeTab).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => switchTab(id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '100px',
                  border: '1.5px solid var(--border-color)',
                  background: '#fff',
                  color: 'var(--text-muted)',
                  fontSize: '0.78rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <Icon size={13} />
                {label}
                <ChevronRight size={13} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Helpers ── */
const PolicyContent = ({ title, updated, children }) => (
  <div>
    <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '32px' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-green)', marginBottom: '6px' }}>{title}</h2>
      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Last updated: {updated}</p>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
      {children}
    </div>
  </div>
);

const Section = ({ title, children }) => (
  <div>
    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-color)', marginBottom: '10px' }}>{title}</h3>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {React.Children.map(children, child => {
        if (!child) return null;
        if (child.type === 'ul') {
          return (
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {child.props.children}
            </ul>
          );
        }
        return child;
      })}
    </div>
  </div>
);

export default Policies;
