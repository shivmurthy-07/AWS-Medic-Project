import { Button, Spin, Tag } from 'antd';
import moment from 'moment';
import { FaBriefcase, FaRegClock, FaLocationArrow, FaCalendarAlt, FaBan } from 'react-icons/fa';
import { doctorTimeSlot } from '../../constant/global';
import { useGetAppointmentTimeQuery } from '../../redux/api/timeSlotApi';
import './AppointmentFlow.css';
import './index.css';

const SelectApppointment = ({ selectedDate, handleDateChange, selectTime, setSelectTime, selectedDoctor }) => {
  const handleSelectTime = (time) => setSelectTime(time);

  const next7Days = Array.from({ length: 7 }, (_, i) => moment().clone().add(i + 1, 'days'));

  const fullName = selectedDoctor
    ? `Dr. ${(selectedDoctor.firstName || '')} ${(selectedDoctor.lastName || '')}`.trim() || 'Doctor'
    : 'Doctor';
  const clinicLocation = selectedDoctor
    ? [
        selectedDoctor.clinicName,
        selectedDoctor.city,
        selectedDoctor.state,
        'India',
      ].filter(Boolean).join(', ')
    : 'India';

  const dayStr = selectedDate ? moment(selectedDate).format('dddd').toLowerCase() : '';
  const dateStr = selectedDate ? moment(selectedDate).format('YYYY-MM-DD') : '';

  const { data: dynamicSlots, isLoading: isSlotsLoading } = useGetAppointmentTimeQuery(
    {
      id: selectedDoctor?.id,
      day: dayStr,
      date: dateStr,
    },
    {
      skip: !selectedDoctor?.id || !selectedDate,
    }
  );

  // Group slots
  let morningSlots = [];
  let afternoonSlots = [];

  if (dynamicSlots && dynamicSlots.length > 0) {
    dynamicSlots.forEach((item) => {
      const slot = item.slot;
      const isAm = (slot?.time || '').toUpperCase().includes('AM');
      if (isAm) {
        morningSlots.push(slot);
      } else {
        afternoonSlots.push(slot);
      }
    });
  } else {
    // Fallback static slots if doctor has not created custom intervals
    const amTimes = doctorTimeSlot.filter((item) => item.includes('AM'));
    const pmTimes = doctorTimeSlot.filter((item) => item.includes('PM'));
    morningSlots = amTimes.map((t) => ({ time: t, isAvailable: true }));
    afternoonSlots = pmTimes.map((t) => ({ time: t, isAvailable: true }));
  }

  const renderSlotButton = (slot) => {
    const isAvailable = slot.isAvailable !== false;
    const isSelected = slot.time === selectTime;
    const blockBadge = slot.isBlocked
      ? ` [${slot.blockReason || 'Unavailable'}]`
      : slot.isBooked
        ? ' [Booked]'
        : '';

    return (
      <Button
        key={slot.time}
        type={isSelected ? 'primary' : 'default'}
        size="small"
        disabled={!isAvailable}
        style={!isAvailable ? { opacity: 0.55, textDecoration: 'line-through', cursor: 'not-allowed' } : {}}
        onClick={() => isAvailable && handleSelectTime(slot.time)}
      >
        {slot.time}{blockBadge}
      </Button>
    );
  };

  return (
    <div className="appointment-step appointment-step--datetime">
      <p className="appointment-step__title">Select date &amp; time</p>
      <p className="appointment-step__subtitle">
        Choose an available date and time. Any blocked slots (due to doctor's leaves, surgeries, seminars, or prior bookings) are automatically disabled.
      </p>

      <div className="datetime-summary">
        <div className="datetime-summary__row">
          <FaBriefcase className="icon" />
          <span className="datetime-summary__label">Doctor</span>
          <span className="datetime-summary__value">{fullName}</span>
        </div>
        <div className="datetime-summary__row">
          <FaRegClock className="icon" />
          <span className="datetime-summary__label">Duration</span>
          <span className="datetime-summary__value">30 min</span>
        </div>
        <div className="datetime-summary__row">
          <FaLocationArrow className="icon" />
          <span className="datetime-summary__label">Location</span>
          <span className="datetime-summary__value">{clinicLocation} · Clinic Visit / Telehealth</span>
        </div>
        {(selectedDate || selectTime) && (
          <div className="datetime-summary__row">
            <FaCalendarAlt className="icon" />
            <span className="datetime-summary__label">Selected</span>
            <span className="datetime-summary__value">
              {selectedDate && moment(selectedDate).format('LL')}
              {selectTime && ` · ${selectTime}`}
            </span>
          </div>
        )}
      </div>

      <p className="appointment-step__subtitle" style={{ marginBottom: '0.5rem' }}>
        {selectedDate ? `Selected date: ${moment(selectedDate).format('LL')}` : 'Pick a date'}
      </p>
      <div className="datetime-dates">
        {next7Days.map((day) => {
          const isActive =
            selectedDate && moment(selectedDate).format('YYYY-MM-DD') === day.format('YYYY-MM-DD');
          return (
            <div
              key={day.valueOf()}
              className={`datetime-date-card ${isActive ? 'datetime-date-card--active' : ''}`}
              onClick={() => handleDateChange(day)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleDateChange(day)}
              aria-pressed={isActive}
            >
              <div className="day-num">{day.format('D')}</div>
              <div className="month-year">{day.format('MMM YYYY')}</div>
              <div className="weekday">{day.format('dddd')}</div>
            </div>
          );
        })}
      </div>

      {isSlotsLoading ? (
        <div className="text-center my-4">
          <Spin tip="Checking doctor availability..." />
        </div>
      ) : (
        <>
          <p className="appointment-step__subtitle" style={{ marginBottom: '0.5rem' }}>
            {selectTime
              ? `Selected: ${selectTime} – ${moment(selectTime, 'hh:mm A').add(30, 'minutes').format('hh:mm A')}`
              : 'Pick an available time slot'}
          </p>

          <div className="datetime-times-section">
            <h4>Morning Slots</h4>
            <div className="d-flex flex-wrap gap-2">
              {morningSlots.length > 0 ? (
                morningSlots.map(renderSlotButton)
              ) : (
                <span className="text-muted small">No morning slots available for this date.</span>
              )}
            </div>
          </div>

          <div className="datetime-times-section">
            <h4>Afternoon &amp; Evening Slots</h4>
            <div className="d-flex flex-wrap gap-2">
              {afternoonSlots.length > 0 ? (
                afternoonSlots.map(renderSlotButton)
              ) : (
                <span className="text-muted small">No afternoon slots available for this date.</span>
              )}
            </div>
          </div>
        </>
      )}

      {selectedDate && !selectTime && (
        <p className="appointment-step__subtitle mt-3" role="status">
          Date selected. Choose an available (active) time slot to enable Next.
        </p>
      )}
    </div>
  );
};

export default SelectApppointment;
