import DashboardLayout from '../DashboardLayout/DashboardLayout';
import {
	Card,
	Table,
	Button,
	Tag,
	Input,
	DatePicker,
	Space,
	Popconfirm,
	message,
	Typography,
	Modal,
	Form,
	Select,
	Divider
} from 'antd';
import {
	FaEye,
	FaEdit,
	FaTrash,
	FaSearch,
	FaPills,
	FaUserMd,
	FaPlus,
	FaPrescriptionBottleAlt,
	FaPrint
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import {
	useDeletePrescriptionMutation,
	useGetDoctorPrescriptionQuery,
	useGetPatientPrescriptionQuery,
	useCreatePrescriptionMutation,
} from '../../../redux/api/prescriptionApi';
import { useGetDoctorAppointmentsQuery } from '../../../redux/api/appointmentApi';
import { useState } from 'react';
import moment from 'moment';
import useAuthCheck from '../../../redux/hooks/useAuthCheck';
import './Prescription.css';

const { RangePicker } = DatePicker;
const { Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const Prescription = () => {
	const { role } = useAuthCheck();

	return (
		<DashboardLayout>
			{role === 'doctor' ? <DoctorPrescriptions /> : <PatientPrescriptions />}
		</DashboardLayout>
	);
};

const DoctorPrescriptions = () => {
	const { data, isLoading, refetch } = useGetDoctorPrescriptionQuery();
	const { data: appointmentsData } = useGetDoctorAppointmentsQuery({});
	const [deletePrescription, { isLoading: deleteLoading }] = useDeletePrescriptionMutation();
	const [createPrescription, { isLoading: isCreating }] = useCreatePrescriptionMutation();

	const [searchTerm, setSearchTerm] = useState('');
	const [dateRange, setDateRange] = useState(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [form] = Form.useForm();
	const [medicines, setMedicines] = useState([
		{ id: 1, medicine: '', dosage: '500 mg', frequency: 'Twice Daily (BID)', duration: '7 days' }
	]);

	const appointments = appointmentsData || [];

	const filteredData = data?.filter((prescription) => {
		const matchesSearch =
			prescription?.disease?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			prescription?.appointment?.trackingId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			`${prescription?.patient?.firstName} ${prescription?.patient?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());

		const matchesDateRange =
			!dateRange || moment(prescription?.createdAt).isBetween(dateRange[0], dateRange[1], 'day', '[]');

		return matchesSearch && matchesDateRange;
	});

	const stats = [
		{ title: 'Total Prescriptions', count: data?.length || 0, color: 'primary' },
		{ title: 'Active Prescriptions', count: data?.filter((p) => !p?.isArchived)?.length || 0, color: 'success' },
		{ title: 'Archived', count: data?.filter((p) => p?.isArchived)?.length || 0, color: 'warning' },
	];

	const handleAddMedicine = () => {
		setMedicines([
			...medicines,
			{ id: Date.now(), medicine: '', dosage: '250 mg', frequency: 'Once Daily (QD)', duration: '5 days' }
		]);
	};

	const handleRemoveMedicine = (id) => {
		if (medicines.length > 1) {
			setMedicines(medicines.filter((m) => m.id !== id));
		}
	};

	const handleMedicineChange = (id, field, value) => {
		setMedicines(medicines.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
	};

	const handleCreatePrescription = async (values) => {
		const validMeds = medicines.filter(m => m.medicine && m.medicine.trim().length > 0);
		if (validMeds.length === 0) {
			message.error('Please enter at least one medicine with name and dosage');
			return;
		}

		try {
			const payload = {
				appointmentId: values.appointmentId,
				disease: values.disease,
				daignosis: values.daignosis || values.disease,
				test: values.test || '',
				instruction: values.instruction || '',
				followUpdate: values.followUpdate ? values.followUpdate.format('YYYY-MM-DD') : '',
				status: 'Completed',
				patientType: 'Outpatient',
				medicine: validMeds.map(m => ({
					medicine: m.medicine,
					dosage: m.dosage,
					frequency: m.frequency,
					duration: m.duration
				}))
			};

			await createPrescription({ data: payload }).unwrap();
			message.success('Prescription issued and uploaded successfully!');
			setIsModalOpen(false);
			form.resetFields();
			setMedicines([{ id: 1, medicine: '', dosage: '500 mg', frequency: 'Twice Daily (BID)', duration: '7 days' }]);
			refetch();
		} catch (error) {
			message.error(error?.data?.message || 'Failed to issue prescription');
		}
	};

	const columns = [
		{
			title: 'Appointment ID',
			key: 'appointmentId',
			width: 150,
			render: (_, record) => <Tag color="#667eea">{record?.appointment?.trackingId || 'N/A'}</Tag>,
		},
		{
			title: 'Patient',
			key: 'patient',
			render: (_, record) => (
				<div>
					<div className="fw-semibold">
						{record?.patient?.firstName} {record?.patient?.lastName}
					</div>
					<Text type="secondary" className="small d-block">
						{record?.patient?.email || record?.patient?.mobile}
					</Text>
				</div>
			),
		},
		{
			title: 'Diagnosis / Condition',
			dataIndex: 'disease',
			key: 'disease',
			render: (d) => <span className="fw-medium text-dark">{d || '—'}</span>,
		},
		{
			title: 'Medicines Count',
			key: 'medCount',
			width: 150,
			render: (_, record) => (
				<Tag color="cyan">
					<FaPills className="me-1" />
					{record?.medicines?.length || 0} medicines
				</Tag>
			),
		},
		{
			title: 'Follow-Up',
			dataIndex: 'followUpdate',
			key: 'followUpdate',
			width: 140,
			render: (date) => (date ? moment(date).format('MMM DD, YYYY') : 'None'),
		},
		{
			title: 'Created Date',
			dataIndex: 'createdAt',
			key: 'createdAt',
			width: 130,
			render: (date) => moment(date).format('MMM DD, YYYY'),
		},
		{
			title: 'Actions',
			key: 'actions',
			fixed: 'right',
			width: 220,
			render: (_, record) => (
				<Space wrap>
					<Link to={`/dashboard/prescription/${record.id}`}>
						<Button type="primary" icon={<FaEye />} size="small">
							View
						</Button>
					</Link>
					<Link to={`/dashboard/appointment/treatment/edit/${record.id}`}>
						<Button type="default" icon={<FaEdit />} size="small">
							Edit
						</Button>
					</Link>
					<Popconfirm
						title="Delete prescription?"
						description="Are you sure you want to delete this prescription?"
						onConfirm={() => deleteHandler(record.id)}
						okText="Yes"
						cancelText="No"
					>
						<Button danger icon={<FaTrash />} size="small" loading={deleteLoading} />
					</Popconfirm>
				</Space>
			),
		},
	];

	const deleteHandler = async (id) => {
		try {
			await deletePrescription(id).unwrap();
			message.success('Prescription deleted successfully!');
			refetch();
		} catch (error) {
			message.error(error?.data?.message || 'Failed to delete prescription');
		}
	};

	return (
		<div className="dashboard-card prescription-page">
			<div className="dashboard-card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
				<div>
					<h3 className="dashboard-card-title mb-1">Prescriptions &amp; Medicines</h3>
					<p className="text-muted small mb-0">Upload prescriptions, manage prescribed medicines, dosages, and instructions.</p>
				</div>
				<Button
					type="primary"
					icon={<FaPlus />}
					size="large"
					onClick={() => setIsModalOpen(true)}
					style={{ borderRadius: 8 }}
				>
					Upload / Issue Prescription
				</Button>
			</div>

			<div className="stats-mini-grid mb-4">
				{stats.map((stat, index) => (
					<Card key={index} className={`stat-mini-card stat-mini-card-${stat.color}`}>
						<div className="stat-mini-details">
							<div className="stat-mini-title">{stat.title}</div>
							<div className="stat-mini-count">{stat.count}</div>
						</div>
					</Card>
				))}
			</div>

			<Card className="prescription-table-card">
				<div className="table-toolbar mb-3">
					<Space wrap>
						<Input
							placeholder="Search by patient name, condition, or tracking ID..."
							prefix={<FaSearch />}
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							style={{ width: 320 }}
							allowClear
						/>
						<RangePicker value={dateRange} onChange={setDateRange} format="MMM DD, YYYY" />
					</Space>
				</div>

				<Table
					columns={columns}
					dataSource={filteredData}
					rowKey="id"
					loading={isLoading}
					pagination={{
						pageSize: 10,
						showSizeChanger: true,
						showTotal: (total) => `Total ${total} prescriptions`,
					}}
					scroll={{ x: 1000 }}
				/>
			</Card>

			{/* Upload / Issue Prescription Modal */}
			<Modal
				title="Upload &amp; Issue Prescription"
				open={isModalOpen}
				onCancel={() => {
					setIsModalOpen(false);
					form.resetFields();
				}}
				footer={null}
				width={780}
			>
				<Form form={form} layout="vertical" onFinish={handleCreatePrescription}>
					<Form.Item
						name="appointmentId"
						label="Select Patient Appointment"
						rules={[{ required: true, message: 'Please select an appointment' }]}
					>
						<Select placeholder="Choose patient appointment" showSearch optionFilterProp="children">
							{appointments.map((apt) => (
								<Option key={apt.id} value={apt.id}>
									{apt.firstName} {apt.lastName} — #{apt.trackingId} ({moment(apt.scheduleDate).format('MMM DD, YYYY')} at {apt.scheduleTime})
								</Option>
							))}
						</Select>
					</Form.Item>

					<div className="row">
						<div className="col-md-6">
							<Form.Item
								name="disease"
								label="Primary Disease / Condition"
								rules={[{ required: true, message: 'Please enter primary condition' }]}
							>
								<Input placeholder="e.g. Acute Bronchitis, Type 2 Diabetes, Hypertension" />
							</Form.Item>
						</div>
						<div className="col-md-6">
							<Form.Item name="daignosis" label="Clinical Diagnosis">
								<Input placeholder="e.g. Mild respiratory tract infection" />
							</Form.Item>
						</div>
					</div>

					<div className="row">
						<div className="col-md-6">
							<Form.Item name="test" label="Recommended Diagnostic Tests">
								<Input placeholder="e.g. Chest X-Ray, CBC Blood Test, Lipid Panel" />
							</Form.Item>
						</div>
						<div className="col-md-6">
							<Form.Item name="followUpdate" label="Follow-Up Date">
								<DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
							</Form.Item>
						</div>
					</div>

					<Divider orientation="left">List of Medicines to be Taken</Divider>

					{medicines.map((item, index) => (
						<div key={item.id} className="p-3 mb-3 bg-light rounded border">
							<div className="d-flex justify-content-between align-items-center mb-2">
								<span className="fw-bold text-primary">Medicine #{index + 1}</span>
								{medicines.length > 1 && (
									<Button danger size="small" type="link" onClick={() => handleRemoveMedicine(item.id)}>
										Remove
									</Button>
								)}
							</div>
							<div className="row g-2">
								<div className="col-md-4">
									<label className="form-label small text-muted">Medicine Name</label>
									<Input
										placeholder="e.g. Paracetamol, Amoxicillin"
										value={item.medicine}
										onChange={(e) => handleMedicineChange(item.id, 'medicine', e.target.value)}
									/>
								</div>
								<div className="col-md-3">
									<label className="form-label small text-muted">Dosage</label>
									<Input
										placeholder="e.g. 500 mg, 1 tablet"
										value={item.dosage}
										onChange={(e) => handleMedicineChange(item.id, 'dosage', e.target.value)}
									/>
								</div>
								<div className="col-md-3">
									<label className="form-label small text-muted">Frequency</label>
									<Select
										style={{ width: '100%' }}
										value={item.frequency}
										onChange={(v) => handleMedicineChange(item.id, 'frequency', v)}
									>
										<Option value="Once Daily (QD)">Once Daily</Option>
										<Option value="Twice Daily (BID)">Twice Daily (BID)</Option>
										<Option value="Three Times Daily (TID)">Three Times Daily (TID)</Option>
										<Option value="Four Times Daily (QID)">Four Times Daily (QID)</Option>
										<Option value="As Needed (PRN)">As Needed (PRN)</Option>
									</Select>
								</div>
								<div className="col-md-2">
									<label className="form-label small text-muted">Duration</label>
									<Input
										placeholder="e.g. 5 days, 1 month"
										value={item.duration}
										onChange={(e) => handleMedicineChange(item.id, 'duration', e.target.value)}
									/>
								</div>
							</div>
						</div>
					))}

					<Button type="dashed" icon={<FaPlus />} onClick={handleAddMedicine} block className="mb-3">
						Add Another Medicine
					</Button>

					<Form.Item name="instruction" label="Special Instructions &amp; Dietary Advice">
						<TextArea rows={3} placeholder="e.g. Take after food. Drink plenty of water. Avoid cold beverages." />
					</Form.Item>

					<div className="d-flex justify-content-end gap-2 mt-4">
						<Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
						<Button type="primary" htmlType="submit" loading={isCreating}>
							Issue &amp; Save Prescription
						</Button>
					</div>
				</Form>
			</Modal>
		</div>
	);
};

const PatientPrescriptions = () => {
	const { data, isLoading } = useGetPatientPrescriptionQuery();
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedPrescription, setSelectedPrescription] = useState(null);
	const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

	const filtered = data?.filter(
		(p) =>
			!searchTerm ||
			p?.disease?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			p?.appointment?.trackingId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			`${p?.doctor?.firstName} ${p?.doctor?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
	);

	const columns = [
		{
			title: 'Doctor',
			key: 'doctor',
			render: (_, record) => (
				<div className="d-flex align-items-center gap-2">
					<FaUserMd className="text-primary" size={20} />
					<div>
						<div className="fw-semibold">
							Dr. {record?.doctor?.firstName} {record?.doctor?.lastName}
						</div>
						<Text type="secondary" className="small">
							{record?.doctor?.specialization || 'Consultant Specialist'}
						</Text>
					</div>
				</div>
			),
		},
		{
			title: 'Diagnosis / Visit Focus',
			dataIndex: 'disease',
			key: 'disease',
			render: (t) => <span className="fw-medium text-dark">{t || '—'}</span>,
		},
		{
			title: 'Medicines to Take',
			key: 'medicines',
			render: (_, record) => (
				<Tag color="cyan">
					<FaPills className="me-1" />
					{record?.medicines?.length || 0} Prescribed
				</Tag>
			),
		},
		{
			title: 'Tracking ID',
			key: 'tid',
			width: 140,
			render: (_, record) => <Tag color="#667eea">#{record?.appointment?.trackingId || 'N/A'}</Tag>,
		},
		{
			title: 'Prescribed Date',
			dataIndex: 'createdAt',
			key: 'createdAt',
			width: 130,
			render: (d) => moment(d).format('MMM DD, YYYY'),
		},
		{
			title: 'Actions',
			key: 'action',
			width: 220,
			render: (_, record) => (
				<Space>
					<Button
						type="primary"
						size="small"
						icon={<FaEye />}
						onClick={() => {
							setSelectedPrescription(record);
							setIsDetailModalOpen(true);
						}}
					>
						View Medicines
					</Button>
					<Link to={`/dashboard/prescription/${record.id}`}>
						<Button type="default" size="small" icon={<FaPrint />}>
							Print
						</Button>
					</Link>
				</Space>
			),
		},
	];

	return (
		<div className="dashboard-card prescription-page prescription-page--patient">
			<div className="dashboard-card-header">
				<div>
					<h3 className="dashboard-card-title mb-1">My Prescriptions &amp; Medicines</h3>
					<p className="text-muted small mb-0">
						Review all medicines prescribed by your healthcare providers, dosage intervals, and clinical advice.
					</p>
				</div>
			</div>

			<Card className="prescription-table-card mb-4">
				<div className="table-toolbar mb-3">
					<Input
						placeholder="Search by condition, doctor, or tracking ID..."
						prefix={<FaSearch />}
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						style={{ width: 320 }}
						allowClear
					/>
				</div>

				<Table
					columns={columns}
					dataSource={filtered}
					rowKey="id"
					loading={isLoading}
					pagination={{ pageSize: 8 }}
					scroll={{ x: 900 }}
				/>
			</Card>

			{/* Patient View Medicine Modal */}
			<Modal
				title="Prescription &amp; Medication Schedule"
				open={isDetailModalOpen}
				onCancel={() => setIsDetailModalOpen(false)}
				footer={[
					selectedPrescription && (
						<Link key="print" to={`/dashboard/prescription/${selectedPrescription.id}`} className="me-2">
							<Button type="default" icon={<FaPrint />}>Print Full Prescription</Button>
						</Link>
					),
					<Button key="close" type="primary" onClick={() => setIsDetailModalOpen(false)}>
						Done
					</Button>
				]}
				width={700}
			>
				{selectedPrescription && (
					<div className="pt-2">
						<div className="p-3 bg-light rounded mb-3">
							<div className="d-flex justify-content-between align-items-center">
								<div>
									<h6 className="mb-1 text-primary">
										Dr. {selectedPrescription.doctor?.firstName} {selectedPrescription.doctor?.lastName}
									</h6>
									<div className="text-muted small">{selectedPrescription.doctor?.specialization}</div>
								</div>
								<div className="text-end">
									<div className="small text-muted">Prescribed On:</div>
									<strong>{moment(selectedPrescription.createdAt).format('MMM DD, YYYY')}</strong>
								</div>
							</div>
							<div className="mt-2 pt-2 border-top">
								<strong>Diagnosis / Condition: </strong>
								<span>{selectedPrescription.disease}</span>
							</div>
						</div>

						<h6 className="fw-bold mb-3">List of Medicines to be Taken:</h6>
						<div className="table-responsive mb-3">
							<table className="table table-bordered table-striped">
								<thead className="table-light">
									<tr>
										<th>Medicine Name</th>
										<th>Dosage</th>
										<th>Frequency</th>
										<th>Duration</th>
									</tr>
								</thead>
								<tbody>
									{selectedPrescription.medicines?.map((med, i) => (
										<tr key={med.id || i}>
											<td className="fw-semibold text-primary">{med.medicine}</td>
											<td>{med.dosage}</td>
											<td><Tag color="blue">{med.frequency}</Tag></td>
											<td>{med.duration}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						{selectedPrescription.instruction && (
							<div className="p-3 rounded bg-warning-subtle mb-3">
								<h6 className="fw-bold text-dark mb-1">Doctor's Instructions &amp; Advice:</h6>
								<p className="mb-0 text-dark" style={{ whiteSpace: 'pre-wrap' }}>{selectedPrescription.instruction}</p>
							</div>
						)}

						{selectedPrescription.test && (
							<div className="p-3 rounded bg-info-subtle mb-3">
								<h6 className="fw-bold text-dark mb-1">Recommended Tests:</h6>
								<p className="mb-0 text-dark">{selectedPrescription.test}</p>
							</div>
						)}

						{selectedPrescription.followUpdate && (
							<div className="small text-muted">
								Follow-Up Visit Scheduled: <strong>{moment(selectedPrescription.followUpdate).format('MMMM DD, YYYY')}</strong>
							</div>
						)}
					</div>
				)}
			</Modal>
		</div>
	);
};

export default Prescription;
