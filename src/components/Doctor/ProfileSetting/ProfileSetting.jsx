import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../DashboardLayout/DashboardLayout';
import useAuthCheck from '../../../redux/hooks/useAuthCheck';
import {
    Card, Form, Input, Button, Select, DatePicker, message, Avatar, Tabs,
    Progress, Alert, Table, Modal, Popconfirm, Tag, InputNumber, Switch, Divider, Space
} from 'antd';
import {
    FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaRupeeSign, FaGraduationCap,
    FaBriefcase, FaAward, FaHospital, FaPlus, FaTrash, FaCheck, FaTimes, FaClock, FaNotesMedical, FaTint
} from 'react-icons/fa';
import {
    useGetDoctorQuery,
    useUpdateDoctorMutation,
    useAddDoctorEducationMutation,
    useDeleteDoctorEducationMutation,
    useAddDoctorExperienceMutation,
    useDeleteDoctorExperienceMutation,
    useAddDoctorAwardMutation,
    useDeleteDoctorAwardMutation,
} from '../../../redux/api/doctorApi';
import { useUpdatePatientMutation } from '../../../redux/api/patientApi';
import {
    useGetConsultationServicesQuery,
    useGetDoctorFeesQuery,
    useCreateFeeChangeRequestMutation,
    useGetMyFeeChangeRequestsQuery,
} from '../../../redux/api/feeApi';
import ImageUploadWithCrop from '../../UI/ImageUploadWithCrop';
import moment from 'moment';
import { doctorSpecialistOptions } from '../../../constant/global';
import { getDoctorProfileProgress } from '../../../utils/doctorProfileCompletion';
import { formatCurrency } from '../../../utils/formatCurrency';

const { TextArea } = Input;
const { Option } = Select;

const ProfileSetting = () => {
    const { role, data: authData } = useAuthCheck();
    const doctorId = authData?.id || authData?.userId;

    const { data: doctorDetails, refetch: refetchDoctor } = useGetDoctorQuery(doctorId, {
        skip: role !== 'doctor' || !doctorId,
    });
    const currentDoctor = doctorDetails || authData;

    const [form] = Form.useForm();
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(authData?.img || null);
    const [isImageModalVisible, setIsImageModalVisible] = useState(false);
    const [selectedServices, setSelectedServices] = useState([]);

    // Sub-modal states for doctor
    const [eduModalOpen, setEduModalOpen] = useState(false);
    const [expModalOpen, setExpModalOpen] = useState(false);
    const [awardModalOpen, setAwardModalOpen] = useState(false);
    const [feeRequestModalOpen, setFeeRequestModalOpen] = useState(false);

    const [eduForm] = Form.useForm();
    const [expForm] = Form.useForm();
    const [awardForm] = Form.useForm();
    const [feeRequestForm] = Form.useForm();

    const [updateDoctor, { isLoading: doctorLoading }] = useUpdateDoctorMutation();
    const [updatePatient, { isLoading: patientLoading }] = useUpdatePatientMutation();

    // Doctor sub-resource mutations
    const [addEducation, { isLoading: isAddingEdu }] = useAddDoctorEducationMutation();
    const [deleteEducation] = useDeleteDoctorEducationMutation();
    const [addExperience, { isLoading: isAddingExp }] = useAddDoctorExperienceMutation();
    const [deleteExperience] = useDeleteDoctorExperienceMutation();
    const [addAward, { isLoading: isAddingAward }] = useAddDoctorAwardMutation();
    const [deleteAward] = useDeleteDoctorAwardMutation();

    // Fee API hooks
    const { data: servicesData } = useGetConsultationServicesQuery({ active: true }, { skip: role !== 'doctor' });
    const { data: myFeeRequestsData, refetch: refetchFeeRequests } = useGetMyFeeChangeRequestsQuery(undefined, { skip: role !== 'doctor' });
    const [createFeeChangeRequest, { isLoading: isSubmittingFeeReq }] = useCreateFeeChangeRequestMutation();

    const services = servicesData?.data || servicesData || [];
    const feeRequests = myFeeRequestsData?.data || myFeeRequestsData || [];

    const isLoading = role === 'doctor' ? doctorLoading : patientLoading;

    // Doctor profile completion
    const profileProgress = useMemo(() => {
        if (role !== 'doctor') return null;
        return getDoctorProfileProgress(currentDoctor);
    }, [role, currentDoctor]);

    useEffect(() => {
        const d = currentDoctor;
        if (d) {
            form.setFieldsValue({
                firstName: d.firstName,
                lastName: d.lastName,
                email: d.email,
                phone: d.phone || d.mobile,
                gender: d.gender,
                bloodGroup: d.bloodGroup,
                dob: (d.dob || d.dateOfBirth) && moment(d.dob || d.dateOfBirth).isValid()
                    ? moment(d.dob || d.dateOfBirth)
                    : null,
                address: d.address,
                city: d.city,
                state: d.state,
                country: role === 'doctor' ? 'India' : (d.country || 'India'),
                postalCode: d.postalCode || d.zipCode,
                ...(role === 'doctor' && {
                    biography: d.biography,
                    clinicName: d.clinicName,
                    clinicAddress: d.clinicAddress,
                    hospitalName: d.hospitalName,
                    hospitalAddress: d.hospitalAddress,
                    price: d.price,
                    specialization: d.specialization,
                    secondarySpecializations: d.secondarySpecializations,
                    degree: d.degree,
                    college: d.college,
                    completionYear: d.completionYear,
                    registration: d.registration,
                    registrationCouncil: d.registrationCouncil,
                    languages: d.languages,
                    designation: d.designation,
                    experience: d.experience,
                    onlineConsultation: d.onlineConsultation !== false,
                    inPersonConsultation: d.inPersonConsultation !== false,
                }),
            });
            if (role === 'doctor' && d.services) {
                setSelectedServices(d.services.split(','));
            }
            if (d.img) {
                setImagePreview(d.img);
            }
        }
    }, [currentDoctor, form, role]);

    const handleImageCropped = (file, preview) => {
        setImageFile(file);
        setImagePreview(preview);
    };

    const handleSubmit = async (values) => {
        try {
            const formData = new FormData();
            if (imageFile) {
                formData.append('file', imageFile);
            }

            const formattedDob = values.dob
                ? moment(values.dob).format('YYYY-MM-DD')
                : role === 'doctor' && values.dob === null
                    ? null
                    : undefined;
            const cleanPhone = values.phone ? values.phone.trim() : undefined;

            let dataToSubmit;
            if (role === 'doctor') {
                const { dateOfBirth, mobile, bloodGroup, email, ...doctorValues } = values;
                dataToSubmit = {
                    ...doctorValues,
                    dob: formattedDob,
                    phone: cleanPhone,
                    country: 'India',
                    services: selectedServices.join(','),
                    biography: values.biography ? values.biography.trim() : undefined,
                };
            } else {
                dataToSubmit = {
                    firstName: values.firstName,
                    lastName: values.lastName,
                    dateOfBirth: formattedDob,
                    bloodGroup: values.bloodGroup,
                    mobile: cleanPhone,
                    city: values.city,
                    state: values.state,
                    zipCode: values.postalCode,
                    gender: values.gender,
                    country: values.country,
                    address: values.address,
                };
            }

            formData.append('data', JSON.stringify(dataToSubmit));

            if (role === 'doctor') {
                await updateDoctor({ data: formData, id: doctorId }).unwrap();
                refetchDoctor();
            } else {
                await updatePatient({ data: formData, id: authData?.id || authData?.userId }).unwrap();
            }

            message.success('Profile updated successfully!');
        } catch (error) {
            message.error(error?.data?.message || 'Failed to update profile. Please check your inputs.');
        }
    };

    // Sub-handlers for Education, Experience, Awards, Fees
    const handleAddEducation = async (values) => {
        try {
            await addEducation(values).unwrap();
            message.success('Education qualification added.');
            setEduModalOpen(false);
            eduForm.resetFields();
            refetchDoctor();
        } catch (err) {
            message.error(err?.data?.message || 'Could not add education entry.');
        }
    };

    const handleDeleteEducation = async (id) => {
        try {
            await deleteEducation(id).unwrap();
            message.success('Education entry deleted.');
            refetchDoctor();
        } catch (err) {
            message.error(err?.data?.message || 'Could not delete education entry.');
        }
    };

    const handleAddExperience = async (values) => {
        try {
            await addExperience(values).unwrap();
            message.success('Work experience added.');
            setExpModalOpen(false);
            expForm.resetFields();
            refetchDoctor();
        } catch (err) {
            message.error(err?.data?.message || 'Could not add experience.');
        }
    };

    const handleDeleteExperience = async (id) => {
        try {
            await deleteExperience(id).unwrap();
            message.success('Experience record deleted.');
            refetchDoctor();
        } catch (err) {
            message.error(err?.data?.message || 'Could not delete experience record.');
        }
    };

    const handleAddAward = async (values) => {
        try {
            await addAward(values).unwrap();
            message.success('Award / Certification added.');
            setAwardModalOpen(false);
            awardForm.resetFields();
            refetchDoctor();
        } catch (err) {
            message.error(err?.data?.message || 'Could not add award.');
        }
    };

    const handleDeleteAward = async (id) => {
        try {
            await deleteAward(id).unwrap();
            message.success('Award removed.');
            refetchDoctor();
        } catch (err) {
            message.error(err?.data?.message || 'Could not remove award.');
        }
    };

    const handleFeeRequestSubmit = async (values) => {
        try {
            await createFeeChangeRequest(values).unwrap();
            message.success('Fee change request submitted to Super Admin for approval.');
            setFeeRequestModalOpen(false);
            feeRequestForm.resetFields();
            refetchFeeRequests();
        } catch (err) {
            message.error(err?.data?.message || 'Could not submit fee request.');
        }
    };

    const tabsItems = [
        {
            key: '1',
            label: 'Personal Details',
            children: (
                <div>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <Form.Item label="First Name" name="firstName" rules={[{ required: true, message: 'Please enter first name' }]}>
                                <Input prefix={<FaUser />} size="large" />
                            </Form.Item>
                        </div>
                        <div className="col-md-6">
                            <Form.Item label="Last Name" name="lastName" rules={[{ required: true, message: 'Please enter last name' }]}>
                                <Input prefix={<FaUser />} size="large" />
                            </Form.Item>
                        </div>
                        <div className="col-md-6">
                            <Form.Item label="Email" name="email">
                                <Input prefix={<FaEnvelope />} size="large" readOnly disabled />
                            </Form.Item>
                        </div>
                        <div className="col-md-6">
                            <Form.Item
                                label="Phone Number"
                                name="phone"
                                rules={[
                                    { required: role === 'doctor', message: 'Please enter contact phone number' },
                                    {
                                        validator: (_, value) => {
                                            if (!value || value.trim() === '') {
                                                return role === 'doctor'
                                                    ? Promise.reject(new Error('Phone number is required'))
                                                    : Promise.resolve();
                                            }
                                            const cleaned = value.replace(/[\s()\-.]/g, '');
                                            if (/^(?:\+?[1-9]\d{7,14}|0\d{9,11})$/.test(cleaned)) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error('Enter a valid 10-15 digit phone number (e.g. +91 98765 43210 or 9035762007)'));
                                        }
                                    }
                                ]}
                            >
                                <Input prefix={<FaPhone />} size="large" placeholder="+91 98765 43210" />
                            </Form.Item>
                        </div>
                        <div className="col-md-6">
                            <Form.Item
                                label="Gender"
                                name="gender"
                                rules={[{ required: role === 'doctor', message: 'Please select gender' }]}
                            >
                                <Select size="large" placeholder="Select Gender">
                                    <Option value="male">Male</Option>
                                    <Option value="female">Female</Option>
                                    <Option value="other">Other</Option>
                                </Select>
                            </Form.Item>
                        </div>
                        {role === 'patient' && (
                            <div className="col-md-6">
                                <Form.Item label="Blood Group" name="bloodGroup">
                                    <Select size="large" placeholder="Select Blood Group">
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
                            </div>
                        )}
                        <div className="col-md-6">
                            <Form.Item
                                label="Date of Birth"
                                name="dob"
                                extra={role === 'doctor' ? undefined : "Date of birth cannot be in the future."}
                                rules={role === 'doctor' ? [] : [
                                    {
                                        validator: (_, value) => {
                                            if (!value) {
                                                return Promise.resolve();
                                            }
                                            const m = moment(value);
                                            if (!m.isValid()) {
                                                return Promise.reject(new Error('Enter a valid date'));
                                            }
                                            if (m.isAfter(moment(), 'day')) {
                                                return Promise.reject(new Error('Date of birth cannot be in the future'));
                                            }
                                            return Promise.resolve();
                                        }
                                    }
                                ]}
                            >
                                <DatePicker
                                    size="large"
                                    style={{ width: '100%' }}
                                    format="YYYY-MM-DD"
                                    placeholder="Select Date of Birth (YYYY-MM-DD)"
                                    disabledDate={
                                        role === 'doctor'
                                            ? undefined
                                            : (current) => Boolean(current && current > moment().endOf('day'))
                                    }
                                />
                            </Form.Item>
                        </div>
                    </div>

                    <h5 className="mt-4 mb-3 text-secondary">Address & Location</h5>
                    <div className="row g-3">
                        <div className="col-12">
                            <Form.Item label="Street Address" name="address">
                                <Input size="large" prefix={<FaMapMarkerAlt />} placeholder="Full address" />
                            </Form.Item>
                        </div>
                        <div className="col-md-4">
                            <Form.Item label="City" name="city">
                                <Input size="large" placeholder="E.g., Bangalore, Mumbai" />
                            </Form.Item>
                        </div>
                        <div className="col-md-4">
                            <Form.Item label="State" name="state">
                                <Input size="large" placeholder="E.g., Karnataka, Maharashtra" />
                            </Form.Item>
                        </div>
                        <div className="col-md-4">
                            <Form.Item label="Postal Code" name="postalCode">
                                <Input size="large" placeholder="ZIP / PIN Code" />
                            </Form.Item>
                        </div>
                    </div>
                </div>
            ),
        },
        ...(role === 'doctor' ? [
            {
                key: '2',
                label: 'Professional Profile',
                children: (
                    <div>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <Form.Item label="Primary Specialization" name="specialization" rules={[{ required: true }]}>
                                    <Input size="large" placeholder="E.g., Cardiology, Dermatology" />
                                </Form.Item>
                            </div>
                            <div className="col-md-6">
                                <Form.Item label="Additional Specializations" name="secondarySpecializations">
                                    <Input size="large" placeholder="E.g., Interventional Cardiology, Pediatric Heart Care" />
                                </Form.Item>
                            </div>
                            <div className="col-md-6">
                                <Form.Item label="Professional Designation" name="designation">
                                    <Input size="large" placeholder="E.g., Senior Consultant, Chief Surgeon" />
                                </Form.Item>
                            </div>
                            <div className="col-md-6">
                                <Form.Item label="Medical Registration Number" name="registration">
                                    <Input size="large" placeholder="E.g., MCI-2018-98432" />
                                </Form.Item>
                            </div>
                            <div className="col-md-6">
                                <Form.Item label="Registration Council" name="registrationCouncil">
                                    <Input size="large" placeholder="E.g., Karnataka Medical Council, NMC" />
                                </Form.Item>
                            </div>
                            <div className="col-md-6">
                                <Form.Item label="Languages Spoken" name="languages">
                                    <Input size="large" placeholder="E.g., English, Hindi, Kannada" />
                                </Form.Item>
                            </div>
                            <div className="col-12">
                                <Form.Item
                                    label="Professional Biography"
                                    name="biography"
                                    extra="Provide at least 30 characters describing your clinical philosophy, specialty focus, and experience."
                                    rules={[
                                        { required: true, message: 'Please provide a professional biography' },
                                        { min: 30, message: 'Biography must be at least 30 characters describing your practice' },
                                        { max: 5000, message: 'Biography cannot exceed 5000 characters' },
                                        {
                                            validator: (_, value) => {
                                                if (!value || value.trim().length < 30) {
                                                    return Promise.reject(new Error('Biography must be at least 30 characters'));
                                                }
                                                const uniqueChars = new Set(value.toLowerCase().replace(/[^a-z]/g, '')).size;
                                                if (uniqueChars < 8) {
                                                    return Promise.reject(new Error('Please enter a meaningful, complete biography description'));
                                                }
                                                return Promise.resolve();
                                            }
                                        }
                                    ]}
                                >
                                    <TextArea
                                        rows={4}
                                        showCount
                                        maxLength={5000}
                                        placeholder="Describe your background, clinical expertise, qualifications, and patient care philosophy..."
                                    />
                                </Form.Item>
                            </div>
                        </div>

                        <h5 className="mt-4 mb-3 text-secondary">Clinic & Hospital Practice Details</h5>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <Form.Item label="Clinic Name" name="clinicName">
                                    <Input size="large" prefix={<FaHospital />} placeholder="Clinic name" />
                                </Form.Item>
                            </div>
                            <div className="col-md-6">
                                <Form.Item label="Hospital Affiliation" name="hospitalName">
                                    <Input size="large" prefix={<FaHospital />} placeholder="Hospital name" />
                                </Form.Item>
                            </div>
                            <div className="col-12">
                                <Form.Item label="Clinic Address" name="clinicAddress">
                                    <Input size="large" placeholder="Complete clinic address" />
                                </Form.Item>
                            </div>
                            <div className="col-md-4">
                                <Form.Item label="Base Consultation Fee (₹)" name="price">
                                    <Input type="number" size="large" prefix={<FaRupeeSign />} placeholder="500" />
                                </Form.Item>
                            </div>
                            <div className="col-md-4">
                                <Form.Item label="Telehealth (Online) Available" name="onlineConsultation" valuePropName="checked">
                                    <Switch checkedChildren="Yes" unCheckedChildren="No" />
                                </Form.Item>
                            </div>
                            <div className="col-md-4">
                                <Form.Item label="In-Person Clinic Available" name="inPersonConsultation" valuePropName="checked">
                                    <Switch checkedChildren="Yes" unCheckedChildren="No" />
                                </Form.Item>
                            </div>
                        </div>
                    </div>
                ),
            },
            {
                key: '3',
                label: <span><FaGraduationCap className="me-1" /> Education</span>,
                children: (
                    <div>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <span className="text-secondary">Medical degrees, residencies, and fellowships.</span>
                            <Button type="primary" icon={<FaPlus />} onClick={() => setEduModalOpen(true)}>
                                Add Degree
                            </Button>
                        </div>
                        <Table
                            dataSource={currentDoctor?.education || []}
                            rowKey="id"
                            pagination={false}
                            columns={[
                                { title: 'Degree', dataIndex: 'degree', key: 'degree', render: (t) => <strong>{t}</strong> },
                                { title: 'Specialization', dataIndex: 'specialization', key: 'specialization', render: (s) => s || 'General' },
                                { title: 'College / University', dataIndex: 'college', key: 'college' },
                                { title: 'Graduation Year', dataIndex: 'completionYear', key: 'completionYear' },
                                {
                                    title: 'Action',
                                    key: 'action',
                                    render: (_, r) => (
                                        <Popconfirm title="Delete this education entry?" onConfirm={() => handleDeleteEducation(r.id)}>
                                            <Button size="small" danger icon={<FaTrash />} />
                                        </Popconfirm>
                                    ),
                                },
                            ]}
                            locale={{ emptyText: <div className="py-4 text-muted">No education entries added yet. Click &quot;Add Degree&quot; above.</div> }}
                        />
                    </div>
                ),
            },
            {
                key: '4',
                label: <span><FaBriefcase className="me-1" /> Work Experience</span>,
                children: (
                    <div>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <span className="text-secondary">Hospital appointments and clinical practice history.</span>
                            <Button type="primary" icon={<FaPlus />} onClick={() => setExpModalOpen(true)}>
                                Add Experience
                            </Button>
                        </div>
                        <Table
                            dataSource={currentDoctor?.workExperience || []}
                            rowKey="id"
                            pagination={false}
                            columns={[
                                { title: 'Hospital / Facility', dataIndex: 'hospitalName', key: 'hospitalName', render: (h) => <strong>{h}</strong> },
                                { title: 'Designation', dataIndex: 'designation', key: 'designation' },
                                { title: 'Department', dataIndex: 'department', key: 'department', render: (d) => d || 'Clinical' },
                                {
                                    title: 'Duration',
                                    key: 'duration',
                                    render: (_, r) => `${r.startDate || ''} - ${r.isCurrent ? 'Present' : r.endDate || ''}`,
                                },
                                {
                                    title: 'Action',
                                    key: 'action',
                                    render: (_, r) => (
                                        <Popconfirm title="Delete this experience entry?" onConfirm={() => handleDeleteExperience(r.id)}>
                                            <Button size="small" danger icon={<FaTrash />} />
                                        </Popconfirm>
                                    ),
                                },
                            ]}
                            locale={{ emptyText: <div className="py-4 text-muted">No experience entries recorded. Click &quot;Add Experience&quot; above.</div> }}
                        />
                    </div>
                ),
            },
            {
                key: '5',
                label: <span><FaAward className="me-1" /> Awards & Certs</span>,
                children: (
                    <div>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <span className="text-secondary">Honors, fellowships, board certifications, and awards.</span>
                            <Button type="primary" icon={<FaPlus />} onClick={() => setAwardModalOpen(true)}>
                                Add Award
                            </Button>
                        </div>
                        <Table
                            dataSource={currentDoctor?.awardsCertifications || []}
                            rowKey="id"
                            pagination={false}
                            columns={[
                                { title: 'Award / Certificate Title', dataIndex: 'title', key: 'title', render: (t) => <strong>{t}</strong> },
                                { title: 'Issuing Organization', dataIndex: 'organization', key: 'organization' },
                                { title: 'Year', dataIndex: 'year', key: 'year' },
                                {
                                    title: 'Action',
                                    key: 'action',
                                    render: (_, r) => (
                                        <Popconfirm title="Delete this award?" onConfirm={() => handleDeleteAward(r.id)}>
                                            <Button size="small" danger icon={<FaTrash />} />
                                        </Popconfirm>
                                    ),
                                },
                            ]}
                            locale={{ emptyText: <div className="py-4 text-muted">No awards or certifications listed yet.</div> }}
                        />
                    </div>
                ),
            },
            {
                key: '6',
                label: <span><FaRupeeSign className="me-1" /> Consultation Fees</span>,
                children: (
                    <div>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <div>
                                <h6 className="mb-0 fw-bold">Doctor Consultation Fees & Change Requests</h6>
                                <small className="text-muted">Submit customized fee change requests for administrative review and approval.</small>
                            </div>
                            <Button type="primary" icon={<FaPlus />} onClick={() => setFeeRequestModalOpen(true)}>
                                Request Fee Adjustment
                            </Button>
                        </div>

                        <div className="mb-4">
                            <h6 className="text-secondary fw-semibold">Active Configured Fees</h6>
                            <Table
                                dataSource={currentDoctor?.customFees || []}
                                rowKey="id"
                                pagination={false}
                                columns={[
                                    { title: 'Service', dataIndex: ['service', 'name'], key: 'service' },
                                    { title: 'Mode', dataIndex: 'mode', key: 'mode', render: (m) => <Tag color="blue">{m}</Tag> },
                                    { title: 'Fee', dataIndex: 'fee', key: 'fee', render: (f) => <strong className="text-success">{formatCurrency(f)}</strong> },
                                    { title: 'Status', key: 'status', render: () => <Tag color="green">Active</Tag> },
                                ]}
                                locale={{ emptyText: <span>Standard base rate applies ({formatCurrency(currentDoctor?.price || 500)}). No doctor-specific overrides configured.</span> }}
                            />
                        </div>

                        <div>
                            <h6 className="text-secondary fw-semibold">My Submitted Fee Change Requests</h6>
                            <Table
                                dataSource={feeRequests}
                                rowKey="id"
                                pagination={{ pageSize: 5 }}
                                columns={[
                                    { title: 'Service', dataIndex: ['service', 'name'], key: 'service' },
                                    { title: 'Mode', dataIndex: 'mode', key: 'mode', render: (m) => <Tag color="blue">{m}</Tag> },
                                    { title: 'Proposed Fee', dataIndex: 'proposedFee', key: 'proposedFee', render: (f) => <strong>{formatCurrency(f)}</strong> },
                                    { title: 'Reason', dataIndex: 'reason', key: 'reason' },
                                    { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag color={s === 'APPROVED' ? 'green' : s === 'REJECTED' ? 'red' : 'gold'}>{s}</Tag> },
                                    { title: 'Admin Feedback', dataIndex: 'adminComment', key: 'adminComment', render: (c) => c || '—' },
                                ]}
                                locale={{ emptyText: <span>No fee change requests submitted yet.</span> }}
                            />
                        </div>
                    </div>
                ),
            },
        ] : []),
    ];

    return (
        <DashboardLayout>
            <div className="dashboard-card mb-5">
                <div className="dashboard-card-header mb-3">
                    <h3 className="dashboard-card-title">{role === 'doctor' ? 'Doctor Profile Settings & Credentials' : 'Patient Profile Settings'}</h3>
                </div>

                {/* Profile Completion Indicator for Doctor */}
                {role === 'doctor' && profileProgress && (
                    <Card className="mb-4 border-0 shadow-sm bg-light">
                        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                            <div>
                                <strong className="text-dark">Profile Completion: {profileProgress.percent}%</strong>
                                <div className="text-muted small">
                                    A complete profile improves patient confidence and satisfies hospital registry requirements.
                                </div>
                            </div>
                            <Tag color={profileProgress.complete ? 'green' : 'orange'}>
                                {profileProgress.complete ? 'Verified & Complete' : 'Incomplete Profile'}
                            </Tag>
                        </div>
                        <Progress
                            percent={profileProgress.percent}
                            status={profileProgress.complete ? 'success' : 'active'}
                            strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
                        />
                        {profileProgress.missing && profileProgress.missing.length > 0 && (
                            <div className="mt-3">
                                <small className="fw-semibold text-secondary d-block mb-1">Missing Information to Complete:</small>
                                <div className="d-flex flex-wrap gap-1">
                                    {profileProgress.missing.map((field) => (
                                        <Tag key={field} color="volcano">{field}</Tag>
                                    ))}
                                </div>
                            </div>
                        )}
                    </Card>
                )}

                <Card className="border-0 shadow-sm">
                    <div className="profile-header-section mb-4 d-flex align-items-center gap-3">
                        <Avatar src={imagePreview} icon={<FaUser />} size={100} className="shadow-sm" />
                        <div>
                            <Button type="primary" onClick={() => setIsImageModalVisible(true)}>
                                Change Profile Photo
                            </Button>
                            <div className="text-muted small mt-1">Supports JPG, PNG, WEBP (Square cropped recommended)</div>
                        </div>
                    </div>

                    <Form form={form} layout="vertical" onFinish={handleSubmit}>
                        <Tabs items={tabsItems} />

                        <div className="text-center mt-4 pt-3 border-top">
                            <Button type="primary" htmlType="submit" size="large" loading={isLoading}>
                                Save Changes
                            </Button>
                        </div>
                    </Form>
                </Card>
            </div>

            <ImageUploadWithCrop
                visible={isImageModalVisible}
                onCancel={() => setIsImageModalVisible(false)}
                onImageCropped={handleImageCropped}
                aspect={1}
                maxSizeMB={2}
                cropShape="round"
            />

            {/* Add Education Modal */}
            <Modal
                title="Add Medical Qualification"
                open={eduModalOpen}
                onCancel={() => { setEduModalOpen(false); eduForm.resetFields(); }}
                footer={null}
            >
                <Form form={eduForm} layout="vertical" onFinish={handleAddEducation}>
                    <Form.Item name="degree" label="Degree / Diploma" rules={[{ required: true, message: 'Enter degree (e.g. MBBS, MD, MS)' }]}>
                        <Input placeholder="E.g., MBBS, MD, MS, Fellowship" />
                    </Form.Item>
                    <Form.Item name="specialization" label="Specialization (Optional)">
                        <Input placeholder="E.g., Internal Medicine, Cardiology" />
                    </Form.Item>
                    <Form.Item name="college" label="College / University" rules={[{ required: true, message: 'Enter college or university name' }]}>
                        <Input placeholder="E.g., All India Institute of Medical Sciences" />
                    </Form.Item>
                    <div className="row">
                        <div className="col-6">
                            <Form.Item name="startYear" label="Start Year">
                                <Input placeholder="2012" />
                            </Form.Item>
                        </div>
                        <div className="col-6">
                            <Form.Item name="completionYear" label="Completion Year">
                                <Input placeholder="2017" />
                            </Form.Item>
                        </div>
                    </div>
                    <div className="d-flex justify-content-end gap-2 mt-3">
                        <Button onClick={() => setEduModalOpen(false)}>Cancel</Button>
                        <Button type="primary" htmlType="submit" loading={isAddingEdu}>Add Degree</Button>
                    </div>
                </Form>
            </Modal>

            {/* Add Experience Modal */}
            <Modal
                title="Add Work Experience"
                open={expModalOpen}
                onCancel={() => { setExpModalOpen(false); expForm.resetFields(); }}
                footer={null}
            >
                <Form form={expForm} layout="vertical" onFinish={handleAddExperience}>
                    <Form.Item name="hospitalName" label="Hospital / Health Facility" rules={[{ required: true, message: 'Enter hospital or facility name' }]}>
                        <Input placeholder="E.g., Manipal Hospitals, Fortis Healthcare" />
                    </Form.Item>
                    <Form.Item name="designation" label="Designation" rules={[{ required: true, message: 'Enter designation' }]}>
                        <Input placeholder="E.g., Associate Consultant, Attending Physician" />
                    </Form.Item>
                    <Form.Item name="department" label="Department">
                        <Input placeholder="E.g., Department of Cardiology" />
                    </Form.Item>
                    <div className="row">
                        <div className="col-6">
                            <Form.Item name="startDate" label="Start Date">
                                <Input placeholder="YYYY or Month YYYY" />
                            </Form.Item>
                        </div>
                        <div className="col-6">
                            <Form.Item name="endDate" label="End Date">
                                <Input placeholder="YYYY or Month YYYY" />
                            </Form.Item>
                        </div>
                    </div>
                    <Form.Item name="isCurrent" label="Currently Working Here" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                    <Form.Item name="description" label="Brief Summary of Responsibilities">
                        <TextArea rows={2} placeholder="Clinical duties, procedures performed..." />
                    </Form.Item>
                    <div className="d-flex justify-content-end gap-2 mt-3">
                        <Button onClick={() => setExpModalOpen(false)}>Cancel</Button>
                        <Button type="primary" htmlType="submit" loading={isAddingExp}>Save Experience</Button>
                    </div>
                </Form>
            </Modal>

            {/* Add Award Modal */}
            <Modal
                title="Add Award / Certification"
                open={awardModalOpen}
                onCancel={() => { setAwardModalOpen(false); awardForm.resetFields(); }}
                footer={null}
            >
                <Form form={awardForm} layout="vertical" onFinish={handleAddAward}>
                    <Form.Item name="title" label="Award / Certificate Title" rules={[{ required: true, message: 'Enter award title' }]}>
                        <Input placeholder="E.g., Best Clinical Research Award, Board Certification in Echocardiography" />
                    </Form.Item>
                    <Form.Item name="organization" label="Issuing Organization">
                        <Input placeholder="E.g., Indian Medical Association, ACC" />
                    </Form.Item>
                    <Form.Item name="year" label="Year Received">
                        <Input placeholder="2021" />
                    </Form.Item>
                    <div className="d-flex justify-content-end gap-2 mt-3">
                        <Button onClick={() => setAwardModalOpen(false)}>Cancel</Button>
                        <Button type="primary" htmlType="submit" loading={isAddingAward}>Save Award</Button>
                    </div>
                </Form>
            </Modal>

            {/* Fee Change Request Modal */}
            <Modal
                title="Request Consultation Fee Adjustment"
                open={feeRequestModalOpen}
                onCancel={() => { setFeeRequestModalOpen(false); feeRequestForm.resetFields(); }}
                footer={null}
            >
                <Form form={feeRequestForm} layout="vertical" onFinish={handleFeeRequestSubmit}>
                    <Form.Item name="serviceId" label="Consultation Category" rules={[{ required: true, message: 'Select service' }]}>
                        <Select placeholder="Select service category">
                            {services.map((s) => (
                                <Option key={s.id} value={s.id}>{s.name}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="mode" label="Appointment Mode" initialValue="IN_PERSON" rules={[{ required: true }]}>
                        <Select>
                            <Option value="IN_PERSON">In-Person Consultation (Clinic)</Option>
                            <Option value="ONLINE">Telehealth (Online)</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="proposedFee" label="Proposed Fee Amount (₹)" rules={[{ required: true, message: 'Enter proposed fee' }]}>
                        <InputNumber min={100} max={50000} style={{ width: '100%' }} prefix="₹" placeholder="E.g. 750" />
                    </Form.Item>
                    <Form.Item name="reason" label="Justification / Reason for Fee Change" rules={[{ required: true, min: 5, message: 'Provide a reason (min 5 characters)' }]}>
                        <TextArea rows={3} placeholder="E.g., Extended 45-minute comprehensive initial workup including diagnostic ECG review." />
                    </Form.Item>
                    <div className="d-flex justify-content-end gap-2 mt-3">
                        <Button onClick={() => setFeeRequestModalOpen(false)}>Cancel</Button>
                        <Button type="primary" htmlType="submit" loading={isSubmittingFeeReq}>Submit Request</Button>
                    </div>
                </Form>
            </Modal>
        </DashboardLayout>
    );
};

export default ProfileSetting;
