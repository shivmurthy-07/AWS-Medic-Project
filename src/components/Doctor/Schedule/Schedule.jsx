import DashboardLayout from '../DashboardLayout/DashboardLayout';
import React, { useEffect, useState } from 'react';
import {
    Card,
    Tag,
    Button,
    Empty,
    message,
    TimePicker,
    Modal,
    Tabs,
    Table,
    Input,
    Select,
    DatePicker,
    Switch,
    Popconfirm,
    Space,
    Form
} from 'antd';
import {
    useCreateTimeSlotMutation,
    useGetDoctorTimeSlotQuery,
    useUpdateTimeSlotMutation,
    useGetDoctorUnavailabilityQuery,
    useCreateDoctorUnavailabilityMutation,
    useDeleteDoctorUnavailabilityMutation
} from '../../../redux/api/timeSlotApi';
import {
    FaPlus,
    FaEdit,
    FaTrash,
    FaClock,
    FaBan,
    FaCalendarTimes,
    FaCalendarCheck,
    FaProcedures,
    FaGraduationCap,
    FaUsers
} from "react-icons/fa";
import moment from 'moment';
import './Schedule.css';

const { Option } = Select;

const Schedule = () => {
    const [mainTab, setMainTab] = useState('weekly');
    const [activeDay, setActiveDay] = useState('sunday');
    const [timeSlot, setTimeSlot] = useState([]);
    const [editTimeSlot, setEditTimeSlot] = useState([]);
    const [addTimeSlot, setAddTimeSlot] = useState([{ id: 1 }]);
    const [UpdateTimeSlot, { isError: uIsError, error: uError, isLoading: UIsLoading, isSuccess: uIsSuccess }] = useUpdateTimeSlotMutation();
    const { data, refetch, isLoading, isError } = useGetDoctorTimeSlotQuery({ day: activeDay });
    const [createTimeSlot, { isError: AIsError, error, isLoading: AIsLoading, isSuccess }] = useCreateTimeSlotMutation();

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Unavailability state & mutations
    const { data: unavailData, isLoading: unavailLoading, refetch: refetchUnavail } = useGetDoctorUnavailabilityQuery();
    const [createUnavailability, { isLoading: isCreatingUnavail }] = useCreateDoctorUnavailabilityMutation();
    const [deleteUnavailability, { isLoading: isDeletingUnavail }] = useDeleteDoctorUnavailabilityMutation();
    const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
    const [blockForm] = Form.useForm();
    const [isFullDay, setIsFullDay] = useState(false);

    const daysOfWeek = [
        { key: 'sunday', label: 'Sunday' },
        { key: 'monday', label: 'Monday' },
        { key: 'tuesday', label: 'Tuesday' },
        { key: 'wednesday', label: 'Wednesday' },
        { key: 'thursday', label: 'Thursday' },
        { key: 'friday', label: 'Friday' },
        { key: 'saturday', label: 'Saturday' },
    ];

    const handleEditOk = () => {
        if (editTimeSlot.length > 0) {
            const { toCreate, toUpdate } = editTimeSlot.reduce((acc, cur) => {
                if (cur.doctorTimeSlotId) {
                    acc.toUpdate.push(cur);
                } else {
                    acc.toCreate.push({ ...cur, day: activeDay });
                }
                return acc;
            }, { toCreate: [], toUpdate: [] });
            UpdateTimeSlot({ timeSlot: toUpdate, create: toCreate });
        }
    };

    useEffect(() => {
        if (!UIsLoading && uIsError) {
            message.error(uError?.data?.message);
        }
        if (uIsSuccess) {
            message.success('Successfully Updated Time Slots');
            setIsEditModalOpen(false);
            setEditTimeSlot([]);
            refetch();
        }
    }, [uIsSuccess, uIsError, UIsLoading, uError?.data?.message, refetch]);

    const handleEditStartTime = (id, timeString) => {
        const findIndex = timeSlot.find(item => item.id === id);
        const updatedItem = { ...findIndex, startTime: timeString };
        setEditTimeSlot(prev => {
            const indexToUpdate = prev.findIndex(item => item.id === id);
            if (indexToUpdate !== -1) {
                const updatedArray = [...prev];
                updatedArray[indexToUpdate] = updatedItem;
                return updatedArray;
            } else {
                return [...prev, updatedItem];
            }
        });
    };

    const handleEditEndTime = (id, timeString) => {
        const findObject = timeSlot.find(item => item.id === id);
        if (findObject) {
            const editedObject = editTimeSlot.find(item => item.id === id);
            const updateObject = editedObject?.id ? { ...editedObject, endTime: timeString } : { ...findObject, endTime: timeString };
            setEditTimeSlot(prev => {
                const findIndex = prev.findIndex(item => item.id === id);
                if (findIndex !== -1) {
                    const updateArray = [...prev];
                    updateArray[findIndex] = updateObject;
                    return updateArray;
                } else {
                    return [...prev, updateObject];
                }
            });
        }
    };

    const handleAddOk = () => {
        const validTimeSlots = addTimeSlot.filter(slot => slot.startTime && slot.endTime);
        if (validTimeSlots.length === 0) {
            message.error('Please add at least one time slot');
            return;
        }
        const timeSlots = validTimeSlots.map(({ id, ...rest }) => rest);
        const postData = {
            day: activeDay,
            timeSlot: timeSlots
        };
        createTimeSlot({ data: postData });
    };

    useEffect(() => {
        if (!AIsLoading && AIsError) {
            message.error(error?.data?.message);
        }
        if (isSuccess) {
            message.success('Successfully Added Time Slots');
            setIsAddModalOpen(false);
            setAddTimeSlot([{ id: 1 }]);
            refetch();
        }
    }, [isSuccess, AIsError, error?.data?.message, AIsLoading, refetch]);

    const handleAddStartTime = (id, timeString) => {
        setAddTimeSlot(prev => (prev.map(item => item.id === id ? { ...item, startTime: timeString } : item)));
    };

    const handleAddEndTime = (id, timeString) => {
        setAddTimeSlot(prev => prev.map(item => item.id === id ? { ...item, endTime: timeString } : item));
    };

    const handleDayChange = (day) => {
        setActiveDay(day);
        refetch();
    };

    useEffect(() => {
        if (data && data[0]?.id) {
            setTimeSlot(data[0].timeSlot || []);
        } else {
            setTimeSlot([]);
        }
    }, [data]);

    const removeEditSlot = (id) => {
        setTimeSlot(timeSlot.filter((item) => item.id !== id));
    };

    const addEditField = () => {
        const newId = timeSlot.length > 0 ? Math.max(...timeSlot.map(s => s.id)) + 1 : 1;
        setTimeSlot([...timeSlot, { id: newId }]);
    };

    const removeAddSlot = (id) => {
        setAddTimeSlot(addTimeSlot.filter((item) => item.id !== id));
    };

    const addNewSlot = () => {
        const newId = addTimeSlot.length > 0 ? Math.max(...addTimeSlot.map(s => s.id)) + 1 : 1;
        setAddTimeSlot([...addTimeSlot, { id: newId }]);
    };

    const openEditModal = () => {
        if (data && data[0]?.timeSlot) {
            setTimeSlot(data[0].timeSlot);
            setIsEditModalOpen(true);
        } else {
            message.warning('No schedule available to edit');
        }
    };

    // Unavailability block handlers
    const handleCreateBlock = async (values) => {
        try {
            await createUnavailability({
                date: values.date.format('YYYY-MM-DD'),
                reason: values.reason,
                title: values.title || '',
                isFullDay: values.isFullDay,
                startTime: values.isFullDay ? null : (values.timeRange ? values.timeRange[0].format('hh:mm a') : null),
                endTime: values.isFullDay ? null : (values.timeRange ? values.timeRange[1].format('hh:mm a') : null),
            }).unwrap();

            message.success('Time slot / period blocked successfully. Patients will see these slots as unavailable.');
            setIsBlockModalOpen(false);
            blockForm.resetFields();
            setIsFullDay(false);
            refetchUnavail();
        } catch (err) {
            message.error(err?.data?.message || 'Failed to block slot');
        }
    };

    const handleDeleteBlock = async (id) => {
        try {
            await deleteUnavailability(id).unwrap();
            message.success('Block removed. Slot is now open for booking.');
            refetchUnavail();
        } catch (err) {
            message.error(err?.data?.message || 'Failed to remove block');
        }
    };

    const getReasonTag = (reason) => {
        switch (reason) {
            case 'Surgery': return <Tag color="error"><FaProcedures className="me-1" />Surgery</Tag>;
            case 'On Leave': return <Tag color="purple"><FaCalendarTimes className="me-1" />On Leave</Tag>;
            case 'Meeting': return <Tag color="blue"><FaUsers className="me-1" />Meeting</Tag>;
            case 'Seminar': return <Tag color="green"><FaGraduationCap className="me-1" />Seminar / Conference</Tag>;
            default: return <Tag color="orange"><FaBan className="me-1" />Unavailable</Tag>;
        }
    };

    const blockColumns = [
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            render: (d) => moment(d).format('dddd, MMMM DD, YYYY'),
            sorter: (a, b) => moment(a.date).unix() - moment(b.date).unix(),
        },
        {
            title: 'Blocked Timing',
            key: 'timing',
            render: (_, record) => record.isFullDay ? (
                <Tag color="volcano">Full Day Unavailable</Tag>
            ) : (
                <Tag color="cyan">{record.startTime} – {record.endTime}</Tag>
            ),
        },
        {
            title: 'Reason',
            dataIndex: 'reason',
            key: 'reason',
            render: (r) => getReasonTag(r),
        },
        {
            title: 'Details / Event',
            dataIndex: 'title',
            key: 'title',
            render: (t) => t || '—',
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Popconfirm
                    title="Unblock this slot?"
                    description="This slot will become available for patients to book."
                    onConfirm={() => handleDeleteBlock(record.id)}
                    okText="Yes, Unblock"
                    cancelText="No"
                >
                    <Button danger size="small" icon={<FaTrash />} loading={isDeletingUnavail}>
                        Unblock
                    </Button>
                </Popconfirm>
            ),
        },
    ];

    return (
        <DashboardLayout>
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <div>
                    <h2 style={{ fontSize: '1.45rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                        Doctor Availability &amp; Slot Blocking
                    </h2>
                    <p className="text-muted small mb-0">
                        Configure weekly consultation hours and block slots for leaves, surgeries, seminars, or meetings so patients cannot book unavailable times.
                    </p>
                </div>
            </div>

            <Tabs
                activeKey={mainTab}
                onChange={setMainTab}
                type="card"
                className="mb-3"
                items={[
                    {
                        key: 'weekly',
                        label: <span><FaCalendarCheck className="me-2" />Weekly Recurring Schedule</span>,
                    },
                    {
                        key: 'blocking',
                        label: <span><FaBan className="me-2" />Block Slots / Leave &amp; Surgeries ({unavailData?.length || 0})</span>,
                    },
                ]}
            />

            {mainTab === 'weekly' ? (
                <div className="dashboard-card">
                    <div className="dashboard-card-header">
                        <h3 className="dashboard-card-title">Weekly Consultation Timings</h3>
                        <div className="d-flex gap-2">
                            <Button 
                                type="primary" 
                                icon={<FaPlus />}
                                onClick={() => setIsAddModalOpen(true)}
                            >
                                Add Schedule
                            </Button>
                            {data && data[0]?.timeSlot?.length > 0 && (
                                <Button 
                                    type="default" 
                                    icon={<FaEdit />}
                                    onClick={openEditModal}
                                >
                                    Edit Schedule
                                </Button>
                            )}
                        </div>
                    </div>

                    <Tabs
                        activeKey={activeDay}
                        onChange={handleDayChange}
                        items={daysOfWeek.map(day => ({
                            key: day.key,
                            label: day.label,
                        }))}
                    />

                    <Card loading={isLoading}>
                        {isError && <Empty description="Something went wrong loading schedule" />}
                        
                        {!isLoading && !isError && data?.length === 0 && (
                            <Empty description="No schedule set for this day" />
                        )}
                        
                        {!isLoading && !isError && data?.length > 0 && data[0]?.timeSlot && (
                            <div className="schedule-content">
                                {data[0]?.maximumPatient && (
                                    <div className="mb-3">
                                        <h6 className="text-muted">Maximum Patient Limit: {data[0].maximumPatient}</h6>
                                    </div>
                                )}
                                <div className="time-slots-grid">
                                    {data[0].timeSlot.map((time, index) => (
                                        <div key={index} className="time-slot-card">
                                            <FaClock className="time-icon" />
                                            <div className="time-range">
                                                {time?.startTime} - {time?.endTime}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            ) : (
                <div className="dashboard-card">
                    <div className="dashboard-card-header">
                        <div>
                            <h3 className="dashboard-card-title">Blocked Periods &amp; Slot Unavailability</h3>
                            <p className="text-muted small mb-0">
                                Mark when you are on leave, performing surgeries, attending seminars or meetings. Patients will see these slots disabled.
                            </p>
                        </div>
                        <Button
                            type="primary"
                            danger
                            icon={<FaBan />}
                            size="large"
                            onClick={() => setIsBlockModalOpen(true)}
                        >
                            Block A Slot / Mark Leave
                        </Button>
                    </div>

                    <Table
                        columns={blockColumns}
                        dataSource={unavailData || []}
                        rowKey="id"
                        loading={unavailLoading}
                        pagination={{ pageSize: 8 }}
                    />
                </div>
            )}

            {/* Block Slot Modal */}
            <Modal
                title="Block Availability / Mark Unavailability"
                open={isBlockModalOpen}
                onCancel={() => {
                    setIsBlockModalOpen(false);
                    blockForm.resetFields();
                    setIsFullDay(false);
                }}
                footer={null}
                width={560}
            >
                <Form
                    form={blockForm}
                    layout="vertical"
                    onFinish={handleCreateBlock}
                    initialValues={{
                        isFullDay: false,
                        reason: 'Surgery',
                        date: moment().add(1, 'day')
                    }}
                >
                    <Form.Item
                        name="date"
                        label="Select Date"
                        rules={[{ required: true, message: 'Please pick a date' }]}
                    >
                        <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                    </Form.Item>

                    <Form.Item
                        name="reason"
                        label="Reason for Unavailability"
                        rules={[{ required: true, message: 'Please choose reason' }]}
                    >
                        <Select>
                            <Option value="On Leave">On Leave / Vacation</Option>
                            <Option value="Surgery">Surgery / Operation</Option>
                            <Option value="Meeting">Hospital / Clinical Meeting</Option>
                            <Option value="Seminar">Medical Seminar / Conference</Option>
                            <Option value="Unavailable">Personal Emergency / Unavailable</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item name="title" label="Event / Description (Visible to Patients)">
                        <Input placeholder="e.g. Attending National Cardiology Seminar or Emergency Surgery" />
                    </Form.Item>

                    <Form.Item name="isFullDay" label="Block Entire Day?" valuePropName="checked">
                        <Switch checked={isFullDay} onChange={setIsFullDay} />
                    </Form.Item>

                    {!isFullDay && (
                        <Form.Item
                            name="timeRange"
                            label="Blocked Time Range"
                            rules={[{ required: !isFullDay, message: 'Select start and end time' }]}
                        >
                            <TimePicker.RangePicker format="hh:mm a" use12Hours style={{ width: '100%' }} />
                        </Form.Item>
                    )}

                    <div className="d-flex justify-content-end gap-2 mt-4">
                        <Button onClick={() => setIsBlockModalOpen(false)}>Cancel</Button>
                        <Button type="primary" danger htmlType="submit" loading={isCreatingUnavail}>
                            Confirm Block
                        </Button>
                    </div>
                </Form>
            </Modal>

            {/* Edit Recurring Modal */}
            <Modal
                title="Edit Time Slots"
                open={isEditModalOpen}
                onOk={handleEditOk}
                onCancel={() => setIsEditModalOpen(false)}
                width={700}
                confirmLoading={UIsLoading}
            >
                <div className="time-slot-editor">
                    {timeSlot.map((item, index) => (
                        <div key={index} className="time-slot-row">
                            <div className="time-picker-group">
                                <div>
                                    <label>Start Time</label>
                                    <TimePicker
                                        format="HH:mm"
                                        value={item.startTime ? moment(item.startTime, 'HH:mm') : null}
                                        onChange={(time, timeString) => handleEditStartTime(item.id, timeString)}
                                        style={{ width: '100%' }}
                                        size="large"
                                    />
                                </div>
                                <div>
                                    <label>End Time</label>
                                    <TimePicker
                                        format="HH:mm"
                                        value={item.endTime ? moment(item.endTime, 'HH:mm') : null}
                                        onChange={(time, timeString) => handleEditEndTime(item.id, timeString)}
                                        style={{ width: '100%' }}
                                        size="large"
                                    />
                                </div>
                            </div>
                            <Button
                                danger
                                icon={<FaTrash />}
                                onClick={() => removeEditSlot(item.id)}
                            />
                        </div>
                    ))}
                    <Button
                        type="dashed"
                        icon={<FaPlus />}
                        onClick={addEditField}
                        block
                        className="mt-3"
                    >
                        Add More
                    </Button>
                </div>
            </Modal>

            {/* Add Recurring Modal */}
            <Modal
                title="Add Time Slots"
                open={isAddModalOpen}
                onOk={handleAddOk}
                onCancel={() => setIsAddModalOpen(false)}
                width={700}
                confirmLoading={AIsLoading}
            >
                <div className="time-slot-editor">
                    {addTimeSlot.map((item, index) => (
                        <div key={index} className="time-slot-row">
                            <div className="time-picker-group">
                                <div>
                                    <label>Start Time</label>
                                    <TimePicker
                                        format="HH:mm"
                                        value={item.startTime ? moment(item.startTime, 'HH:mm') : null}
                                        onChange={(time, timeString) => handleAddStartTime(item.id, timeString)}
                                        style={{ width: '100%' }}
                                        size="large"
                                    />
                                </div>
                                <div>
                                    <label>End Time</label>
                                    <TimePicker
                                        format="HH:mm"
                                        value={item.endTime ? moment(item.endTime, 'HH:mm') : null}
                                        onChange={(time, timeString) => handleAddEndTime(item.id, timeString)}
                                        style={{ width: '100%' }}
                                        size="large"
                                    />
                                </div>
                            </div>
                            {addTimeSlot.length > 1 && (
                                <Button
                                    danger
                                    icon={<FaTrash />}
                                    onClick={() => removeAddSlot(item.id)}
                                />
                            )}
                        </div>
                    ))}
                    <Button
                        type="dashed"
                        icon={<FaPlus />}
                        onClick={addNewSlot}
                        block
                        className="mt-3"
                    >
                        Add More
                    </Button>
                </div>
            </Modal>
        </DashboardLayout>
    );
};

export default Schedule;
