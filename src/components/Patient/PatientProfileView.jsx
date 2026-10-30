import React from 'react';
import DashboardLayout from '../Doctor/DashboardLayout/DashboardLayout';
import useAuthCheck from '../../redux/hooks/useAuthCheck';
import { useGetPatientQuery, useGetMedicalHistoryQuery } from '../../redux/api/patientApi';
import { Card, Descriptions, Avatar, Button, Tag, Row, Col, Typography, Spin } from 'antd';
import { FaUserInjured, FaEdit, FaLock, FaCalendarPlus, FaEnvelope, FaPhone, FaMapMarkerAlt, FaTint, FaNotesMedical } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import defaultAvatar from '../../images/avatar.jpg';
import moment from 'moment';

const { Title, Text } = Typography;

const PatientProfileView = () => {
    const { data: authUser } = useAuthCheck();
    const patientId = authUser?.id || authUser?.userId;
    const { data: patient, isLoading: patientLoading } = useGetPatientQuery(patientId, { skip: !patientId });
    const { data: medicalHistory, isLoading: historyLoading } = useGetMedicalHistoryQuery(patientId, { skip: !patientId });

    const p = patient || authUser;

    return (
        <DashboardLayout>
            <div className="patient-profile-page">
                <Card className="mb-4 border-0 shadow-sm">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                        <div className="d-flex align-items-center gap-3">
                            <Avatar size={90} src={p?.img || defaultAvatar} icon={<FaUserInjured />} className="shadow-sm" />
                            <div>
                                <Title level={3} className="mb-1">
                                    {p?.firstName} {p?.lastName}
                                </Title>
                                <div className="text-muted d-flex flex-wrap gap-3 small mb-2">
                                    <span><FaEnvelope className="me-1" /> {p?.email}</span>
                                    {p?.mobile && <span><FaPhone className="me-1" /> {p?.mobile}</span>}
                                    {p?.city && <span><FaMapMarkerAlt className="me-1" /> {p?.city}, {p?.country || 'India'}</span>}
                                </div>
                                <div className="d-flex gap-2">
                                    {p?.bloodGroup && <Tag color="red"><FaTint className="me-1" /> {p?.bloodGroup}</Tag>}
                                    <Tag color="blue">{p?.gender ? String(p.gender).toUpperCase() : 'PATIENT'}</Tag>
                                </div>
                            </div>
                        </div>
                        <div className="d-flex flex-wrap gap-2">
                            <Link to="/dashboard/profile-setting">
                                <Button type="primary" icon={<FaEdit />}>Edit Profile</Button>
                            </Link>
                            <Link to="/dashboard/change-password">
                                <Button icon={<FaLock />}>Change Password</Button>
                            </Link>
                            <Link to="/doctors">
                                <Button type="dashed" icon={<FaCalendarPlus />}>Book Doctor</Button>
                            </Link>
                        </div>
                    </div>
                </Card>

                {patientLoading ? (
                    <div className="text-center py-5"><Spin size="large" /></div>
                ) : (
                    <Row gutter={[16, 16]}>
                        <Col xs={24} lg={14}>
                            <Card title="Personal & Demographic Details" className="shadow-sm border-0 mb-4">
                                <Descriptions column={1} bordered size="small">
                                    <Descriptions.Item label="Full Name">{p?.firstName} {p?.lastName}</Descriptions.Item>
                                    <Descriptions.Item label="Email Address">{p?.email}</Descriptions.Item>
                                    <Descriptions.Item label="Mobile Number">{p?.mobile || 'Not provided'}</Descriptions.Item>
                                    <Descriptions.Item label="Gender">{p?.gender ? String(p?.gender).toUpperCase() : 'Not provided'}</Descriptions.Item>
                                    <Descriptions.Item label="Date of Birth">
                                        {p?.dateOfBirth ? moment(p?.dateOfBirth).format('MMMM DD, YYYY') : 'Not provided'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Blood Group">
                                        {p?.bloodGroup ? <Tag color="volcano">{p?.bloodGroup}</Tag> : 'Not provided'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Residential Address">{p?.address || 'Not provided'}</Descriptions.Item>
                                    <Descriptions.Item label="City">{p?.city || 'Not provided'}</Descriptions.Item>
                                    <Descriptions.Item label="State & ZIP">{p?.state ? `${p?.state} - ${p?.zipCode || ''}` : 'Not provided'}</Descriptions.Item>
                                    <Descriptions.Item label="Country">{p?.country || 'India'}</Descriptions.Item>
                                    <Descriptions.Item label="Member Since">
                                        {p?.createdAt ? moment(p?.createdAt).format('LL') : '—'}
                                    </Descriptions.Item>
                                </Descriptions>
                            </Card>
                        </Col>

                        <Col xs={24} lg={10}>
                            <Card
                                title={
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span><FaNotesMedical className="text-primary me-2" /> Medical History Snapshot</span>
                                        <Link to="/dashboard/medical-records">
                                            <Button type="link" size="small">Manage</Button>
                                        </Link>
                                    </div>
                                }
                                className="shadow-sm border-0 mb-4"
                            >
                                {historyLoading ? (
                                    <Spin />
                                ) : (
                                    <div className="d-flex flex-column gap-3">
                                        <div className="p-3 bg-light rounded">
                                            <strong className="d-block text-secondary small mb-1">Known Allergies</strong>
                                            <div>{medicalHistory?.data?.allergies || medicalHistory?.allergies || 'No known drug or environmental allergies listed.'}</div>
                                        </div>
                                        <div className="p-3 bg-light rounded">
                                            <strong className="d-block text-secondary small mb-1">Existing Medical Conditions</strong>
                                            <div>{medicalHistory?.data?.existingConditions || medicalHistory?.existingConditions || 'None reported.'}</div>
                                        </div>
                                        <div className="p-3 bg-light rounded">
                                            <strong className="d-block text-secondary small mb-1">Current Medications</strong>
                                            <div>{medicalHistory?.data?.currentMedications || medicalHistory?.currentMedications || 'None recorded.'}</div>
                                        </div>
                                        <div className="p-3 bg-light rounded">
                                            <strong className="d-block text-secondary small mb-1">Previous Surgeries / Treatments</strong>
                                            <div>{medicalHistory?.data?.previousSurgeries || medicalHistory?.previousSurgeries || 'No previous major surgeries recorded.'}</div>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        </Col>
                    </Row>
                )}
            </div>
        </DashboardLayout>
    );
};

export default PatientProfileView;

