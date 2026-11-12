import moment from 'moment';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Checkbox, Input, Modal, Tag } from 'antd';
import { FaCreditCard, FaUserMd } from 'react-icons/fa';
import img from '../../../images/avatar.jpg';
import { formatCurrency } from '../../../utils/formatCurrency';
import { useCalculateConsultationFeeQuery } from '../../../redux/api/feeApi';
import './BookingCheckout.css';
import '../../Appointment/AppointmentFlow.css';

const CheckoutPage = ({
  isCheck,
  setIsChecked,
  data,
  selectedDate,
  selectTime,
  paymentOption,
  onPaymentOptionChange,
  demoPaymentComplete,
  onDemoPaymentComplete,
  consultationType,
  consultationMode,
}) => {
  const [termsVisible, setTermsVisible] = useState(false);
  const { data: calculatedFeeData } = useCalculateConsultationFeeQuery(
    {
      doctorId: data?.id,
      service: consultationType || 'First Consultation',
      mode: consultationMode || 'IN_PERSON',
    },
    { skip: !data?.id }
  );

  const calc = calculatedFeeData?.data || calculatedFeeData;
  const price = calc?.consultationFee ?? data?.price ?? 60;
  const bookingFee = calc?.bookingFee ?? 10;
  const vat = calc?.vat ?? Math.round((15 / 100) * (Number(price) + bookingFee));
  const total = calc?.totalAmount ?? (Number(price) + bookingFee + vat);
  const [cardDetails, setCardDetails] = useState({
    name: '',
    number: '',
    month: '',
    year: '',
    cvv: '',
  });
  const [cardError, setCardError] = useState('');
  const handleCheck = () => setIsChecked(!isCheck);
  const handleCardChange = (event) => {
    setCardDetails((current) => ({ ...current, [event.target.name]: event.target.value }));
    setCardError('');
    if (demoPaymentComplete) onDemoPaymentComplete(false);
  };
  const handlePaymentOptionChange = (option) => {
    if (option === paymentOption) return;

    setCardDetails({ name: '', number: '', month: '', year: '', cvv: '' });
    setCardError('');
    onDemoPaymentComplete(false);
    onPaymentOptionChange(option);
  };
  const handleAutoFillTestCard = () => {
    setCardDetails({
      name: 'Test Patient',
      number: '4242 4242 4242 4242',
      month: '12',
      year: '28',
      cvv: '123'
    });
    setCardError('');
  };

  const handleSimulatePayment = (event) => {
    event.preventDefault();
    const digits = cardDetails.number.replace(/\D/g, '');
    const month = Number(cardDetails.month);
    const yearText = cardDetails.year.trim();
    const year = yearText.length === 2 ? 2000 + Number(yearText) : Number(yearText);
    const expiry = new Date(year, month, 0, 23, 59, 59);

    if (!cardDetails.name.trim() || !/^\d{12,19}$/.test(digits) ||
      !Number.isInteger(month) || month < 1 || month > 12 ||
      !/^\d{2}(\d{2})?$/.test(yearText) || !Number.isFinite(expiry.getTime()) || expiry < new Date() ||
      !/^\d{3,4}$/.test(cardDetails.cvv)) {
      setCardError('Enter valid card details and a future expiry date.');
      onDemoPaymentComplete(false);
      return;
    }

    setCardError('');
    onDemoPaymentComplete(true);
  };

  const doctorImg = data?.img ?? img;

  const fullName = data
    ? `Dr. ${(data.firstName || '')} ${(data.lastName || '')}`.trim()
    : 'Doctor';

  return (
    <div className="appointment-step appointment-step--payment">
      <p className="appointment-step__title">Payment</p>
      <p className="appointment-step__subtitle">Choose to pay using card or pay at the clinic.</p>

      <div className="checkout-layout">
        <div>
          <Card className="checkout-form-card">
            <p className="checkout-form-card__title">Payment option</p>
            <div className="payment-method-options">
              <button
                type="button"
                className={`payment-method-option ${paymentOption === 'demo' ? 'payment-method-option--active' : ''}`}
                aria-pressed={paymentOption === 'demo'}
                onClick={() => handlePaymentOptionChange('demo')}
              >
                Pay using card
              </button>
              <button
                type="button"
                className={`payment-method-option ${paymentOption === 'cash' ? 'payment-method-option--active' : ''}`}
                aria-pressed={paymentOption === 'cash'}
                onClick={() => handlePaymentOptionChange('cash')}
              >
                Pay at clinic (cash)
              </button>
            </div>

            {paymentOption === 'demo' && (
              <div className="demo-payment">
                <div className="demo-payment__notice" role="note">
                  Test mode: card payments are simulated for project evaluation. No real charge is made, and card details stay in this browser and are never sent to the server.
                  <br />
                  Test card: <strong>4242 4242 4242 4242</strong> · any future expiry · any 3-digit CVV
                  <div className="mt-2">
                    <Button size="small" type="dashed" onClick={handleAutoFillTestCard}>
                      Auto-fill Card Details
                    </Button>
                  </div>
                </div>
                <form className="demo-card-form" onSubmit={handleSimulatePayment} autoComplete="off">
                  <label htmlFor="demo-card-name">Name on card</label>
                  <Input
                    id="demo-card-name"
                    name="name"
                    placeholder="Cardholder Name"
                    value={cardDetails.name}
                    onChange={handleCardChange}
                    maxLength={100}
                    required
                  />
                  <label htmlFor="demo-card-number">Card number</label>
                  <Input
                    id="demo-card-number"
                    name="number"
                    inputMode="numeric"
                    placeholder="4242 4242 4242 4242"
                    value={cardDetails.number}
                    onChange={handleCardChange}
                    maxLength={23}
                    required
                  />
                  <div className="demo-card-form__expiry">
                    <div>
                      <label htmlFor="demo-card-month">Expiry month</label>
                      <Input
                        id="demo-card-month"
                        name="month"
                        inputMode="numeric"
                        placeholder="MM"
                        value={cardDetails.month}
                        onChange={handleCardChange}
                        maxLength={2}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="demo-card-year">Expiry year</label>
                      <Input
                        id="demo-card-year"
                        name="year"
                        inputMode="numeric"
                        placeholder="YY"
                        value={cardDetails.year}
                        onChange={handleCardChange}
                        maxLength={4}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="demo-card-cvv">CVV</label>
                      <Input
                        id="demo-card-cvv"
                        name="cvv"
                        inputMode="numeric"
                        placeholder="123"
                        value={cardDetails.cvv}
                        onChange={handleCardChange}
                        maxLength={4}
                        required
                      />
                    </div>
                  </div>
                  {cardError && <p className="demo-card-form__error" role="alert">{cardError}</p>}
                  {demoPaymentComplete && (
                    <p className="demo-card-form__success" role="status">
                      <FaCreditCard aria-hidden="true" /> Card payment approved (simulated only).
                    </p>
                  )}
                  <Button type="primary" htmlType="submit">
                    {demoPaymentComplete ? 'Update card payment' : 'Confirm card payment'}
                  </Button>
                </form>
              </div>
            )}

            <div className="terms-accept mt-4">
              <Checkbox id="terms_accept" checked={isCheck} onChange={handleCheck}>
                I have read and accept the{' '}
                <a
                  className="text-primary"
                  href="#terms"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setTermsVisible(true);
                  }}
                  style={{ cursor: 'pointer', textDecoration: 'none' }}
                >
                  Terms &amp; Conditions
                </a>
              </Checkbox>
            </div>
          </Card>
        </div>

        <div>
          <Card className="order-summary-card">
            {data && (
              <div className="text-center mb-3">
                <Link to={`/doctors/profile/${data?.id}`} className="booking-doc-img d-block mb-2">
                  {doctorImg ? (
                    <img src={doctorImg} alt={fullName} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div className="select-doctor-card__placeholder" style={{ width: 80, height: 80, borderRadius: '50%', margin: '0 auto' }}>
                      <FaUserMd style={{ fontSize: '2rem' }} />
                    </div>
                  )}
                </Link>
                <h5 className="mb-0" style={{ fontSize: '1rem', fontWeight: 600 }}>{fullName}</h5>
                <p className="form-text mb-0 small">{data?.designation}</p>
              </div>
            )}
            <div className="summary-row">
              <span>Date</span>
              <span>{selectedDate ? moment(selectedDate).format('LL') : '—'}</span>
            </div>
            <div className="summary-row">
              <span>Time</span>
              <span>{selectTime || '—'}</span>
            </div>
            <div className="summary-row">
              <span>Service</span>
              <span>
                <strong>{calc?.serviceName || consultationType || 'First Consultation'}</strong>
                <small className="d-block text-muted text-end">
                  {consultationMode === 'ONLINE' ? 'Telehealth (Online)' : 'In-Person Consultation'}
                </small>
              </span>
            </div>
            <div className="summary-row">
              <span>Consultation fee</span>
              <span>{formatCurrency(price)}</span>
            </div>
            <div className="summary-row">
              <span>Booking fee</span>
              <span>{formatCurrency(10)}</span>
            </div>
            <div className="summary-row">
              <span>VAT (15%)</span>
              <span>{formatCurrency(vat)}</span>
            </div>
            <div className="summary-row summary-total">
              <span>Total</span>
              <span className="amount">{formatCurrency(total)}</span>
            </div>
          </Card>
        </div>
      </div>
      <Modal
        title="Terms & Conditions"
        open={termsVisible}
        onCancel={() => setTermsVisible(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setTermsVisible(false)}>
            Close
          </Button>,
        ]}
      >
        <div className="booking-terms">
          <p><strong>Appointments:</strong> Your booking is subject to the selected doctor and time slot remaining available. Please arrive on time and contact the clinic if you need to change your appointment.</p>
          <p><strong>Fees:</strong> The consultation fee, booking fee, and applicable taxes are shown in the order summary before confirmation.</p>
          <p><strong>Pay using card option:</strong> This is a test-mode card simulation only. Use test card details; no real payment is processed, and card details are not stored or transmitted.</p>
          <p><strong>Information:</strong> Details submitted in this form are used to create and manage your appointment and provide booking updates.</p>
        </div>
      </Modal>
    </div>
  );
};

export default CheckoutPage;
