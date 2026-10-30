import { Checkbox, message, Card, Input, Select, Radio } from 'antd';
import { useEffect, useState } from 'react';
import useAuthCheck from '../../redux/hooks/useAuthCheck';
import { visitReasonOptions } from '../../constant/global';
import { validateAppointmentPatientInfo } from '../../utils/appointmentValidation';
import { useGetConsultationServicesQuery } from '../../redux/api/feeApi';
import '../../components/Appointment/AppointmentFlow.css';

const { TextArea } = Input;

const PersonalInformation = ({ handleChange, selectValue, setPatientId = () => {}, showValidation = false }) => {
  const { firstName, lastName, email, phone, reasonForVisit, description, address, problemType, consultationType, consultationMode } = selectValue;
  const [checked, setChecked] = useState(false);
  const [touched, setTouched] = useState({});
  const { data } = useAuthCheck();
  const { data: servicesData } = useGetConsultationServicesQuery({ active: true });
  const validationErrors = validateAppointmentPatientInfo(selectValue);

  const showError = (field) => (showValidation || touched[field]) ? validationErrors[field] : '';
  const handleBlur = (field) => setTouched((current) => ({ ...current, [field]: true }));

  const onChange = (e) => setChecked(e.target.checked);

  const onFieldChange = (name, value) => {
    handleChange({ target: { name, value } });
  };

  useEffect(() => {
    if (checked) {
      if (data?.id) {
        setPatientId(data.id);
        if (data.firstName && !firstName) onFieldChange('firstName', data.firstName);
        if (data.lastName && !lastName) onFieldChange('lastName', data.lastName);
        if (data.email && !email) onFieldChange('email', data.email);
        if ((data.phone || data.mobile) && !phone) onFieldChange('phone', data.phone || data.mobile);
        if (data.address && !address) onFieldChange('address', data.address);
        message.success('Your account details have been linked and autofilled.');
      } else {
        message.warning('Please log in to link your account.');
      }
    }
  }, [checked, data, setPatientId]);

  return (
    <div className="appointment-step appointment-step--patient">
      <p className="appointment-step__title">Patient information</p>
      <p className="appointment-step__subtitle">Please provide your details and reason for the visit.</p>

      <Card className="patient-form-card" size="small">
        <p className="patient-form-card__title">Account</p>
        <Checkbox checked={checked} onChange={onChange}>
          I already have an account — use my saved details
        </Checkbox>
      </Card>

      <Card className="patient-form-card" size="small">
        <p className="patient-form-card__title">Personal details</p>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">First name</label>
            <Input
              placeholder="First name"
              name="firstName"
              value={firstName || ''}
              onChange={(e) => handleChange(e)}
              onBlur={() => handleBlur('firstName')}
              status={showError('firstName') ? 'error' : ''}
              size="large"
            />
            {showError('firstName') && <small className="text-danger">{showError('firstName')}</small>}
          </div>
          <div className="col-md-6">
            <label className="form-label">Last name</label>
            <Input
              placeholder="Last name"
              name="lastName"
              value={lastName || ''}
              onChange={(e) => handleChange(e)}
              onBlur={() => handleBlur('lastName')}
              status={showError('lastName') ? 'error' : ''}
              size="large"
            />
            {showError('lastName') && <small className="text-danger">{showError('lastName')}</small>}
          </div>
          <div className="col-md-6">
            <label className="form-label">Email</label>
            <Input
              type="email"
              placeholder="email@example.com"
              name="email"
              value={email || ''}
              onChange={(e) => handleChange(e)}
              onBlur={() => handleBlur('email')}
              status={showError('email') ? 'error' : ''}
              size="large"
            />
            {showError('email') && <small className="text-danger">{showError('email')}</small>}
          </div>
          <div className="col-md-6">
            <label className="form-label">Phone</label>
            <Input
              placeholder="Indian mobile number (optional +91)"
              name="phone"
              type="tel"
              inputMode="tel"
              maxLength={16}
              value={phone || ''}
              onChange={(e) => handleChange(e)}
              onBlur={() => handleBlur('phone')}
              status={showError('phone') ? 'error' : ''}
              size="large"
            />
            {showError('phone') && <small className="text-danger">{showError('phone')}</small>}
          </div>
          <div className="col-12">
            <label className="form-label">Address *</label>
            <Input
              placeholder="Enter your complete address (10–250 characters)"
              name="address"
              maxLength={250}
              value={address || ''}
              onChange={(e) => handleChange(e)}
              onBlur={() => handleBlur('address')}
              status={showError('address') ? 'error' : ''}
              size="large"
            />
            {showError('address') && <small className="text-danger">{showError('address')}</small>}
          </div>
        </div>
      </Card>

      <Card className="patient-form-card" size="small">
        <p className="patient-form-card__title">Visit details</p>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Consultation Category *</label>
            <Select
              placeholder="Select consultation type"
              value={consultationType || 'First Consultation'}
              onChange={(value) => onFieldChange('consultationType', value)}
              style={{ width: '100%' }}
              size="large"
              options={(servicesData?.data || servicesData || [
                { name: 'First Consultation' },
                { name: 'Follow-up Consultation' },
                { name: 'Regular Checkup' },
                { name: 'General Consultation' },
                { name: 'Emergency Consultation' },
              ]).map((s) => ({ value: s.name, label: s.name }))}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Appointment Mode *</label>
            <Select
              placeholder="Select mode"
              value={consultationMode || 'IN_PERSON'}
              onChange={(value) => onFieldChange('consultationMode', value)}
              style={{ width: '100%' }}
              size="large"
              options={[
                { value: 'IN_PERSON', label: 'In-person Consultation (Clinic)' },
                { value: 'ONLINE', label: 'Online Telehealth Consultation' },
              ]}
            />
          </div>
          <div className="col-12">
            <label className="form-label">Type of visit / Problem</label>
            <Select
              placeholder="Select type of visit"
              options={visitReasonOptions}
              value={problemType || undefined}
              onChange={(value) => onFieldChange('problemType', value)}
              allowClear
              style={{ width: '100%' }}
              size="large"
            />
          </div>
          <div className="col-12">
            <label className="form-label">Reason for visit *</label>
            <TextArea
              rows={3}
              placeholder="Describe your main reason for this appointment, symptoms, or concerns."
              name="reasonForVisit"
              value={reasonForVisit || ''}
              onChange={(e) => handleChange(e)}
              maxLength={1000}
              onBlur={() => handleBlur('reasonForVisit')}
              status={showError('reasonForVisit') ? 'error' : ''}
              size="large"
            />
            {showError('reasonForVisit') && <small className="text-danger">{showError('reasonForVisit')}</small>}
          </div>
          <div className="col-12">
            <label className="form-label">Additional notes (optional)</label>
            <TextArea
              rows={2}
              placeholder="Any other details you want the doctor to know (medications, allergies, etc.)."
              name="description"
              value={description || ''}
              onChange={(e) => handleChange(e)}
              maxLength={1000}
              onBlur={() => handleBlur('description')}
              status={showError('description') ? 'error' : ''}
              size="large"
            />
            {showError('description') && <small className="text-danger">{showError('description')}</small>}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PersonalInformation;
