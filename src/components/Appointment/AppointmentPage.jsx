import { useEffect, useState } from 'react';
import Footer from '../Shared/Footer/Footer';
import Header from '../Shared/Header/Header';
import CheckoutPage from '../Booking/BookingCheckout/CheckoutPage';
import PersonalInformation from '../Booking/PersonalInformation';
import { Button, Steps, message, Modal } from 'antd';
import moment from 'moment';
import SelectApppointment from './SelectApppointment';
import SelectDoctor from './SelectDoctor';
import useAuthCheck from '../../redux/hooks/useAuthCheck';
import { useCreateAppointmentMutation } from '../../redux/api/appointmentApi';
import { useDispatch } from 'react-redux';
import { addInvoice } from '../../redux/feature/invoiceSlice';
import { useNavigate } from 'react-router-dom';
import { getUserInfo } from '../../service/auth.service';
import { visitReasonOptions } from '../../constant/global';
import { validateAppointmentPatientInfo } from '../../utils/appointmentValidation';
import './AppointmentFlow.css';

const initialValue = {
  paymentMethod: 'paypal',
  paymentType: 'creditCard',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  reasonForVisit: '',
  problemType: '',
  description: '',
  address: '',
  nameOnCard: '',
  cardNumber: '',
  expiredMonth: '',
  cardExpiredYear: '',
  cvv: '',
};

const AppointmentPage = () => {
  const dispatch = useDispatch();
  const { data, role } = useAuthCheck();
  const [current, setCurrent] = useState(0);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectTime, setSelectTime] = useState('');
  const [isCheck, setIsChecked] = useState(false);
  const [selectValue, setSelectValue] = useState(initialValue);
  const [paymentOption, setPaymentOption] = useState('demo');
  const [demoPaymentComplete, setDemoPaymentComplete] = useState(false);
  const [isConfirmDisable, setIsConfirmDisable] = useState(true);
  const [patientId, setPatientId] = useState('');
  const [showPatientInfoErrors, setShowPatientInfoErrors] = useState(false);
  const navigate = useNavigate();

  const authInfo = getUserInfo();
  const effectiveRole = authInfo?.role || role;

  useEffect(() => {
    if (effectiveRole === 'doctor') {
      message.warning('Appointment scheduling is available for patients only.');
      navigate('/dashboard', { replace: true });
    }
  }, [effectiveRole, navigate]);

  const [createAppointment, { data: appointmentData, isError, isSuccess, isLoading, error }] =
    useCreateAppointmentMutation();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSelectValue((current) => ({ ...current, [name]: value }));
  };

  const next = () => setCurrent(current + 1);
  const prev = () => setCurrent(current - 1);
  const handlePatientInfoNext = () => {
    setShowPatientInfoErrors(true);
    if (Object.keys(validateAppointmentPatientInfo(selectValue)).length === 0) {
      next();
    }
  };

  useEffect(() => {
    const isPaymentValid = paymentOption === 'cash' || (paymentOption === 'demo' && demoPaymentComplete);
    setIsConfirmDisable(!isCheck || !isPaymentValid);
  }, [isCheck, paymentOption, demoPaymentComplete]);

  const handleConfirmSchedule = () => {
    const obj = {};
    const isPatientSession = role === 'patient' && data?.id;

    obj.patientInfo = {
      firstName: selectValue.firstName,
      lastName: selectValue.lastName,
      email: selectValue.email,
      phone: selectValue.phone,
      patientId: isPatientSession ? data.id : undefined,
      scheduleDate: selectedDate,
      scheduleTime: selectTime,
      reasonForVisit: [
        selectValue.problemType && visitReasonOptions.find((o) => o.value === selectValue.problemType)?.label,
        selectValue.reasonForVisit,
      ]
        .filter(Boolean)
        .join(' — ') || selectValue.reasonForVisit,
      description: selectValue.description || undefined,
      address: selectValue.address || undefined,
      consultationType: selectValue.consultationType || 'First Consultation',
      consultationMode: selectValue.consultationMode || 'IN_PERSON',
      ...(selectedDoctor?.id && { doctorId: selectedDoctor.id }),
    };
    obj.payment = paymentOption === 'demo'
      ? { paymentType: 'creditCard', paymentMethod: 'demo' }
      : { paymentType: 'cash', paymentMethod: 'cash' };
    createAppointment(obj);
  };

  useEffect(() => {
    if (isSuccess && appointmentData?.id) {
      message.success('Appointment scheduled successfully');
      setSelectValue(initialValue);
      setSelectedDoctor(null);
      setSelectedDate('');
      setSelectTime('');
      setCurrent(0);
      setShowPatientInfoErrors(false);
      dispatch(addInvoice({ ...appointmentData }));

      const goToSuccess = () => navigate(`/booking/success/${appointmentData.id}`);
      Modal.success({
        className: 'appointment-success-modal',
        title: 'Appointment scheduled',
        content: 'Confirmation and details have been sent to your email. You will be redirected to your booking shortly.',
        okText: 'View booking',
        onOk: goToSuccess,
      });
      const t = setTimeout(goToSuccess, 4000);
      return () => clearTimeout(t);
    }
    if (isError) {
      message.error(error?.data?.message || 'Something went wrong');
    }
  }, [isSuccess, isError, appointmentData, error, dispatch, navigate]);

  const handleDateChange = (date) => {
    setSelectedDate(moment(date).format('YYYY-MM-DD HH:mm:ss'));
    setSelectTime('');
  };

  const steps = [
    {
      title: 'Select Doctor',
      content: (
        <SelectDoctor selectedDoctor={selectedDoctor} onSelect={setSelectedDoctor} />
      ),
    },
    {
      title: 'Date & Time',
      content: (
        <SelectApppointment
          handleDateChange={handleDateChange}
          selectedDate={selectedDate}
          selectTime={selectTime}
          setSelectTime={setSelectTime}
          selectedDoctor={selectedDoctor}
        />
      ),
    },
    {
      title: 'Patient Information',
      content: (
        <PersonalInformation
          handleChange={handleChange}
          selectValue={selectValue}
          setPatientId={setPatientId}
          showValidation={showPatientInfoErrors}
        />
      ),
    },
    {
      title: 'Payment',
      content: (
        <CheckoutPage
          isCheck={isCheck}
          setIsChecked={setIsChecked}
          data={selectedDoctor ? { ...selectedDoctor, price: selectedDoctor.price || 60 } : null}
          selectedDate={selectedDate}
          selectTime={selectTime}
          paymentOption={paymentOption}
          onPaymentOptionChange={setPaymentOption}
          demoPaymentComplete={demoPaymentComplete}
          onDemoPaymentComplete={setDemoPaymentComplete}
          consultationType={selectValue.consultationType}
          consultationMode={selectValue.consultationMode}
        />
      ),
    },
  ];

  const items = steps.map((item) => ({ key: item.title, title: item.title }));

  const canProceedStep0 = !!selectedDoctor;
  const canProceedStep1 = !!selectTime && !!selectedDate;

  return (
    <>
      <Header />
      <div className="appointment-page">
        <div className="container container-wrap">
          <Steps current={current} items={items} />
          <div className="appointment-step">{steps[current].content}</div>
          <div className="appointment-actions">
            <div>
              {current > 0 && (
                <Button type="default" size="large" onClick={prev}>
                  Previous
                </Button>
              )}
            </div>
            <div>
              {current < steps.length - 1 && (
                <Button
                  type="primary"
                  size="large"
                  disabled={
                    current === 0
                      ? !canProceedStep0
                      : current === 1
                        ? !canProceedStep1
                        : false
                  }
                  onClick={current === 2 ? handlePatientInfoNext : next}
                >
                  Next
                </Button>
              )}
              {current === steps.length - 1 && (
                <Button
                  type="primary"
                  size="large"
                  disabled={isConfirmDisable}
                  loading={isLoading}
                  onClick={handleConfirmSchedule}
                >
                  Confirm & schedule
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default AppointmentPage;
