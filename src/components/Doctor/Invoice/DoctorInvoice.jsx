import React, { useState } from 'react';
import { useGetDoctorInvoicesQuery, useGetPatientInvoicesQuery } from '../../../redux/api/appointmentApi';
import DashboardLayout from '../DashboardLayout/DashboardLayout';
import { Card, Table, Input, Tag, Button, DatePicker, Select, Space, Avatar } from 'antd';
import { FaEye, FaSearch, FaRupeeSign, FaCreditCard, FaCalendar, FaUserMd, FaFileInvoiceDollar } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import moment from 'moment';
import { formatCurrency } from '../../../utils/formatCurrency';
import useAuthCheck from '../../../redux/hooks/useAuthCheck';
import './DoctorInvoice.css';

const { RangePicker } = DatePicker;

const DoctorInvoice = () => {
    const { role } = useAuthCheck();

    return (
        <DashboardLayout>
            {role === 'doctor' ? <DoctorInvoicesView /> : <PatientInvoicesView />}
        </DashboardLayout>
    );
};

const DoctorInvoicesView = () => {
    const { data, isLoading } = useGetDoctorInvoicesQuery();
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState(null);
    const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');

    const getPatientName = (invoice) => {
        const fullName = `${invoice?.appointment?.patient?.firstName ?? ''} ${invoice?.appointment?.patient?.lastName ?? ''}`;
        return fullName.trim() || "Private Patient";
    };

    const filteredData = data?.filter(invoice => {
        const patientName = getPatientName(invoice).toLowerCase();
        const trackingId = (invoice?.appointment?.trackingId || '').toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = patientName.includes(searchLower) ||
            trackingId.includes(searchLower) ||
            invoice?.id?.toLowerCase().includes(searchLower);
        
        const matchesDateRange = !dateRange || 
            moment(invoice?.createdAt).isBetween(dateRange[0], dateRange[1], 'day', '[]');
        
        const matchesPaymentMethod = paymentMethodFilter === 'all' || 
            invoice?.paymentMethod?.toLowerCase() === paymentMethodFilter;
        
        return matchesSearch && matchesDateRange && matchesPaymentMethod;
    });

    const totalRevenue = filteredData?.reduce((sum, invoice) => sum + (invoice?.totalAmount || 0), 0) || 0;

    const stats = [
        {
            title: 'Total Invoices',
            count: filteredData?.length || 0,
            color: 'primary',
            icon: <FaCalendar />,
        },
        {
            title: 'Total Revenue',
            count: formatCurrency(totalRevenue),
            color: 'success',
            icon: <FaRupeeSign />,
        },
        {
            title: 'Card / Online Payments',
            count: filteredData?.filter(i => ['card', 'demo', 'creditcard'].includes(i?.paymentMethod?.toLowerCase()))?.length || 0,
            color: 'info',
            icon: <FaCreditCard />,
        },
        {
            title: 'Cash at Clinic',
            count: filteredData?.filter(i => i?.paymentMethod?.toLowerCase() === 'cash')?.length || 0,
            color: 'warning',
            icon: <FaRupeeSign />,
        },
    ];

    const getMethodDisplay = (method) => {
        const m = (method || '').toLowerCase();
        if (m === 'demo') return <Tag color="blue">Pay using Card</Tag>;
        if (m === 'cash') return <Tag color="orange">Cash at Clinic</Tag>;
        if (m === 'card' || m === 'creditcard') return <Tag color="blue">Credit / Debit Card</Tag>;
        if (m === 'upi') return <Tag color="cyan">UPI Payment</Tag>;
        return <Tag color="default">{method || 'N/A'}</Tag>;
    };

    const columns = [
        {
            title: 'Appointment ID',
            key: 'invoiceId',
            width: 190,
            render: (_, record) => (
                <div className="fw-bold font-monospace small" style={{ wordBreak: 'break-all', overflowWrap: 'anywhere' }}>
                    #{record?.appointment?.trackingId || record?.appointmentId || record?.id}
                </div>
            ),
        },
        {
            title: 'Patient',
            key: 'patient',
            render: (_, record) => (
                <div className="d-flex align-items-center">
                    <Avatar 
                        src={record?.appointment?.patient?.img} 
                        size={40}
                    />
                    <div className="ms-2">
                        <div className="fw-bold">{getPatientName(record)}</div>
                        <div className="text-muted small">{record?.appointment?.patient?.email}</div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Total Amount',
            key: 'amount',
            width: 130,
            sorter: (a, b) => a.totalAmount - b.totalAmount,
            render: (_, record) => (
                <div className="fw-bold text-success">{formatCurrency(record?.totalAmount)}</div>
            ),
        },
        {
            title: 'Payment Method',
            dataIndex: 'paymentMethod',
            key: 'paymentMethod',
            render: (method) => getMethodDisplay(method),
        },
        {
            title: 'Invoice Date',
            key: 'date',
            width: 140,
            sorter: (a, b) => moment(a.createdAt).unix() - moment(b.createdAt).unix(),
            render: (_, record) => moment(record?.createdAt).format('MMM DD, YYYY'),
        },
        {
            title: 'Actions',
            key: 'actions',
            fixed: 'right',
            width: 100,
            render: (_, record) => (
                <Link to={`/booking/invoice/${record?.appointmentId}`}>
                    <Button type="primary" icon={<FaEye />} size="small">
                        View
                    </Button>
                </Link>
            ),
        },
    ];

    return (
        <div className="dashboard-card">
            <div className="dashboard-card-header">
                <h3 className="dashboard-card-title">Invoices &amp; Revenue Overview</h3>
                <p className="text-muted small mb-0">Track payments, billing invoices, and consult revenue.</p>
            </div>

            <div className="stats-mini-grid mb-4">
                {stats.map((stat, index) => (
                    <Card key={index} className={`stat-mini-card stat-mini-card-${stat.color}`}>
                        <div className="stat-mini-icon">{stat.icon}</div>
                        <div className="stat-mini-details">
                            <div className="stat-mini-title">{stat.title}</div>
                            <div className="stat-mini-count">{stat.count}</div>
                        </div>
                    </Card>
                ))}
            </div>

            <Card>
                <div className="table-toolbar mb-3 d-flex flex-wrap gap-2">
                    <Input
                        placeholder="Search patient name or invoice ID..."
                        prefix={<FaSearch />}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: 280 }}
                        allowClear
                    />
                    <Select
                        value={paymentMethodFilter}
                        onChange={setPaymentMethodFilter}
                        style={{ width: 180 }}
                        options={[
                            { label: 'All Methods', value: 'all' },
                            { label: 'Pay using Card', value: 'demo' },
                            { label: 'Cash at Clinic', value: 'cash' },
                            { label: 'Card', value: 'card' },
                        ]}
                    />
                    <RangePicker
                        value={dateRange}
                        onChange={setDateRange}
                        format="MMM DD, YYYY"
                        style={{ width: 260 }}
                    />
                </div>

                <Table
                    columns={columns}
                    dataSource={filteredData}
                    rowKey="id"
                    loading={isLoading}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} invoices`,
                    }}
                    scroll={{ x: 800 }}
                />
            </Card>
        </div>
    );
};

const PatientInvoicesView = () => {
    const { data, isLoading } = useGetPatientInvoicesQuery();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredData = data?.filter(invoice => {
        const doctorName = `Dr. ${invoice?.appointment?.doctor?.firstName || ''} ${invoice?.appointment?.doctor?.lastName || ''}`.toLowerCase();
        const trackingId = (invoice?.appointment?.trackingId || '').toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        return doctorName.includes(searchLower) ||
            trackingId.includes(searchLower) ||
            invoice?.id?.toLowerCase().includes(searchLower);
    });

    const getMethodDisplay = (method) => {
        const m = (method || '').toLowerCase();
        if (m === 'demo') return <Tag color="blue">Pay using Card</Tag>;
        if (m === 'cash') return <Tag color="orange">Pay at Clinic (Cash)</Tag>;
        if (m === 'card' || m === 'creditcard') return <Tag color="blue">Credit / Debit Card</Tag>;
        return <Tag color="default">{method || 'N/A'}</Tag>;
    };

    const columns = [
        {
            title: 'Appointment ID',
            key: 'invoiceId',
            width: 190,
            render: (_, record) => (
                <div className="fw-bold font-monospace small" style={{ wordBreak: 'break-all', overflowWrap: 'anywhere' }}>
                    #{record?.appointment?.trackingId || record?.appointmentId || record?.id}
                </div>
            ),
        },
        {
            title: 'Consulting Doctor',
            key: 'doctor',
            render: (_, record) => (
                <div className="d-flex align-items-center">
                    <Avatar icon={<FaUserMd />} size={38} className="me-2" style={{ backgroundColor: '#667eea' }} />
                    <div>
                        <div className="fw-bold">
                            Dr. {record?.appointment?.doctor?.firstName} {record?.appointment?.doctor?.lastName}
                        </div>
                        <div className="text-muted small">{record?.appointment?.doctor?.designation}</div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Total Fee',
            key: 'amount',
            render: (_, record) => (
                <div className="fw-bold text-success">{formatCurrency(record?.totalAmount)}</div>
            ),
        },
        {
            title: 'Payment Method',
            dataIndex: 'paymentMethod',
            key: 'paymentMethod',
            render: (method) => getMethodDisplay(method),
        },
        {
            title: 'Date',
            key: 'date',
            render: (_, record) => moment(record?.createdAt).format('MMM DD, YYYY'),
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Link to={`/booking/invoice/${record?.appointmentId}`}>
                    <Button type="primary" icon={<FaEye />} size="small">
                        View Receipt
                    </Button>
                </Link>
            ),
        },
    ];

    return (
        <div className="dashboard-card">
            <div className="dashboard-card-header">
                <h3 className="dashboard-card-title mb-1">My Invoices &amp; Payment Receipts</h3>
                <p className="text-muted small mb-0">View booking receipts, paid consultation fees, and payment breakdown.</p>
            </div>

            <Card>
                <div className="table-toolbar mb-3">
                    <Input
                        placeholder="Search doctor name or invoice ID..."
                        prefix={<FaSearch />}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ maxWidth: 350 }}
                        allowClear
                    />
                </div>

                <Table
                    columns={columns}
                    dataSource={filteredData || []}
                    rowKey="id"
                    loading={isLoading}
                    pagination={{ pageSize: 8 }}
                />
            </Card>
        </div>
    );
};

export default DoctorInvoice;
