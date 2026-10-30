import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../Doctor/DashboardLayout/DashboardLayout';
import useAuthCheck from '../../../redux/hooks/useAuthCheck';
import { useGetMedicalHistoryQuery, useUpdateMedicalHistoryMutation } from '../../../redux/api/patientApi';
import { Card, Form, Input, Select, Button, message, Typography, Row, Col, Alert, Divider } from 'antd';
import { FaNotesMedical, FaSave, FaHeartbeat, FaShieldAlt, FaPills, FaAllergies, FaHospital } from 'react-icons/fa';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const MedicalHistory = () => {
    const { data: authUser } = useAuthCheck();
    const patientId = authUser?.id || authUser?.userId;
    const { data: historyData, isLoading, refetch } = useGetMedicalHistoryQuery(patientId, { skip: !patientId });
    const [updateHistory, { isLoading: isUpdating }] = useUpdateMedicalHistoryMutation();
    const [form] = Form.useForm();
    const [isEditing, setIsEditing] = useState(false);

    const history = historyData?.data || historyData || {};

    useEffect(() => {
        if (history) {
            form.setFieldsValue({
                bloodGroup: history.bloodGroup || undefined,
                allergies: history.allergies || '',
                previousDiseases: history.previousDiseases || '',
                existingConditions: history.existingConditions || '',
                currentMedications: history.currentMedications || '',
                previousSurgeries: history.previousSurgeries || '',
                familyHistory: history.familyHistory || '',
                previousTreatments: history.previousTreatments || '',
                notes: history.notes || '',
            });
        }
    }, [history, form]);

    const onFinish = async (values) => {
        try {
            await updateHistory({ id: patientId, data: values }).unwrap();
            message.success('Medical history updated successfully.');
            setIsEditing(false);
            refetch();
        } catch (error) {
            message.error(error?.data?.message || 'Could not update medical history. Please try again.');
        }
    };

    return (
        <DashboardLayout>
            <div className="medical-history-page">
                <div className="d-flex flex-wrap align-items-center justify-content-between mb-4">
                    <div>
                        <Title level={3} className="mb-1">
                            <FaNotesMedical className="text-primary me-2" /> Personal Medical Records & History
                        </Title>
                        <Text type="secondary">
                            Maintain your clinical background, known allergies, chronic conditions, and surgical history.
                        </Text>
                    </div>
                    <div>
                        {!isEditing ? (
                            <Button type="primary" onClick={() => setIsEditing(true)}>
                                Edit Medical History
                            </Button>
                        ) : (
                            <Button onClick={() => setIsEditing(false)}>Cancel Editing</Button>
                        )}
                    </div>
                </div>

                <Alert
                    message="Privacy & Confidentiality Protected"
                    description="Your medical record is strictly confidential and encrypted. Only you and doctors with whom you have confirmed appointments can view these clinical notes."
                    type="info"
                    showIcon
                    className="mb-4"
                />

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    disabled={!isEditing}
                >
                    <Row gutter={[16, 16]}>
                        <Col xs={24} md={8}>
                            <Card title={<span><FaHeartbeat className="text-danger me-2" /> Blood & Vitals</span>} className="shadow-sm border-0 h-100">
                                <Form.Item name="bloodGroup" label="Blood Group">
                                    <Select placeholder="Select Blood Group" allowClear>
                                        <Option value="A+">A Positive (A+)</Option>
                                        <Option value="A-">A Negative (A-)</Option>
                                        <Option value="B+">B Positive (B+)</Option>
                                        <Option value="B-">B Negative (B-)</Option>
                                        <Option value="AB+">AB Positive (AB+)</Option>
                                        <Option value="AB-">AB Negative (AB-)</Option>
                                        <Option value="O+">O Positive (O+)</Option>
                                        <Option value="O-">O Negative (O-)</Option>
                                    </Select>
                                </Form.Item>
                            </Card>
                        </Col>

                        <Col xs={24} md={16}>
                            <Card title={<span><FaShieldAlt className="text-warning me-2" /> Known Allergies</span>} className="shadow-sm border-0 h-100">
                                <Form.Item
                                    name="allergies"
                                    label="Food, Drug, or Environmental Allergies"
                                    extra="E.g., Penicillin, Peanuts, Latex, Dust mites, Sulfa drugs."
                                >
                                    <TextArea rows={3} placeholder="List any known allergies and reactions..." />
                                </Form.Item>
                            </Card>
                        </Col>
                    </Row>

                    <Row gutter={[16, 16]} className="mt-3">
                        <Col xs={24} md={12}>
                            <Card title={<span><FaHospital className="text-primary me-2" /> Medical Conditions & Previous Diseases</span>} className="shadow-sm border-0 h-100">
                                <Form.Item
                                    name="existingConditions"
                                    label="Existing Chronic Conditions"
                                    extra="E.g., Hypertension, Type 2 Diabetes, Asthma, Thyroid disorder."
                                >
                                    <TextArea rows={3} placeholder="Describe existing long-term medical conditions..." />
                                </Form.Item>

                                <Form.Item
                                    name="previousDiseases"
                                    label="Previous Major Illnesses / Diseases"
                                    extra="E.g., Pneumonia, Hepatitis, Tuberculosis, COVID-19 complications."
                                >
                                    <TextArea rows={3} placeholder="Describe any past major illnesses..." />
                                </Form.Item>
                            </Card>
                        </Col>

                        <Col xs={24} md={12}>
                            <Card title={<span><FaPills className="text-success me-2" /> Current Medications & Treatments</span>} className="shadow-sm border-0 h-100">
                                <Form.Item
                                    name="currentMedications"
                                    label="Daily or Current Medications"
                                    extra="Include dosage and frequency (e.g. Metformin 500mg once daily)."
                                >
                                    <TextArea rows={3} placeholder="List all current medicines, vitamins, and supplements..." />
                                </Form.Item>

                                <Form.Item
                                    name="previousTreatments"
                                    label="Previous Treatments & Therapies"
                                    extra="E.g., Physiotherapy, Chemotherapy, Radiation, Dialysis."
                                >
                                    <TextArea rows={3} placeholder="Describe ongoing or past therapies..." />
                                </Form.Item>
                            </Card>
                        </Col>
                    </Row>

                    <Row gutter={[16, 16]} className="mt-3 mb-4">
                        <Col xs={24} md={12}>
                            <Card title="Previous Surgeries & Procedures" className="shadow-sm border-0 h-100">
                                <Form.Item
                                    name="previousSurgeries"
                                    label="Surgical History"
                                    extra="Procedure name, approximate year, and hospital (e.g. Appendectomy - 2018)."
                                >
                                    <TextArea rows={3} placeholder="List past operations, surgeries, or hospitalizations..." />
                                </Form.Item>
                            </Card>
                        </Col>

                        <Col xs={24} md={12}>
                            <Card title="Family Medical History" className="shadow-sm border-0 h-100">
                                <Form.Item
                                    name="familyHistory"
                                    label="Hereditary & Family Health Background"
                                    extra="E.g., Family history of Heart Disease, Cancer, Diabetes, or Neurological disorders."
                                >
                                    <TextArea rows={3} placeholder="List known health conditions in direct family members..." />
                                </Form.Item>
                            </Card>
                        </Col>
                    </Row>

                    {isEditing && (
                        <div className="d-flex justify-content-end gap-2 mb-4">
                            <Button onClick={() => setIsEditing(false)}>Cancel</Button>
                            <Button type="primary" htmlType="submit" loading={isUpdating} icon={<FaSave />}>
                                Save Medical Records
                            </Button>
                        </div>
                    )}
                </Form>
            </div>
        </DashboardLayout>
    );
};

export default MedicalHistory;

