import DashboardLayout from "../DashboardLayout/DashboardLayout";
import { useNavigate, useParams } from "react-router-dom";
import { FaPlus, FaRegTrashAlt } from "react-icons/fa";
import { Button, DatePicker, Space, message } from "antd";
import dayjs from 'dayjs';
import { useEffect, useState } from "react";
import { DatePickerSinglePresets, DiagnosisOptions, DiseaseOptions, DosageOptions, FrequencyOptions, MedicalCheckupOptions, PatientStatus, appointemntStatusOption } from "../../../constant/global";
import SelectForm from "../../UI/form/SelectForm";
import TextArea from "antd/es/input/TextArea";
import InputAutoCompleteForm from "../../UI/form/InputAutoCompleteForm";
import { useForm } from "react-hook-form";
import SelectFormForMedicine from "../../UI/form/SelectFormForMedicine";
import MedicineRangePickerForm from "../../UI/form/MedicineRangePickerForm";
import { useCreatePrescriptionMutation } from "../../../redux/api/prescriptionApi";
import { useGetSingleAppointmentQuery } from "../../../redux/api/appointmentApi";
import TreatmentOverview from "./TreatmentOverview";

const Treatment = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { data } = useGetSingleAppointmentQuery(id)
    const { handleSubmit } = useForm();
    const [isDisable, setIsDisable] = useState(true);
    const [selectAppointmentStatus, setSelectAppointmentStatus] = useState('');
    const [patientStatus, setPatientStatus] = useState('');
    const [daignosis, setDaignosis] = useState([]);
    const [disease, setDisease] = useState([]);
    const [medicalCheckup, setMedicalCheckup] = useState([]);
    const [instruction, setInstruction] = useState('');
    const [followUpDate, setFollowUpdate] = useState('');
    const [medicineList, setMedicineList] = useState([{ id: 1 }]);

    useEffect(() => {
        const hasCompleteMedicines =
            medicineList.length > 0 &&
            medicineList.every(
                (item) =>
                    String(item?.medicine || '').trim() &&
                    String(item?.dosage || '').trim() &&
                    String(item?.frequency || '').trim() &&
                    String(item?.duration || '').trim()
            );
        const isInputEmpty =
            !selectAppointmentStatus ||
            !patientStatus ||
            disease.length === 0 ||
            !hasCompleteMedicines;
        setIsDisable(isInputEmpty);
    }, [selectAppointmentStatus, patientStatus, followUpDate, instruction, medicineList, daignosis, disease, medicalCheckup]);

    const [createPrescription, { isSuccess, isLoading, isError, error }] = useCreatePrescriptionMutation();

    const addField = (e) => {
        e.preventDefault();
        const nextId = Math.max(...medicineList.map((item) => Number(item?.id) || 0), 0) + 1;
        setMedicineList([...medicineList, { id: nextId }]);
    }

    const removeFromAddTimeSlot = (id) => {
        setMedicineList(medicineList.filter((item) => item.id !== id))
    }

    const handleFollowUpChange = (date) => {
        if (date) {
            setFollowUpdate(dayjs(date).format());
        } else {
            setFollowUpdate('');
        }
    };

    const onSubmit = (data) => {
        if (!selectAppointmentStatus || !patientStatus) {
            message.error('Please select both Appointment Status and Patient Status.');
            return;
        }
        if (disease.length === 0) {
            message.error('Please select at least one Disease or condition.');
            return;
        }
        const hasIncompleteMedicine = medicineList.some(
            (item) =>
                !String(item?.medicine || '').trim() ||
                !String(item?.dosage || '').trim() ||
                !String(item?.frequency || '').trim() ||
                !String(item?.duration || '').trim()
        );
        if (medicineList.length === 0 || hasIncompleteMedicine) {
            message.error('Please fill in Medicine Name, Dosage, Frequency, and Date Range for every medicine.');
            return;
        }

        const obj = {
            status: selectAppointmentStatus,
            patientType: patientStatus,
            disease: disease.join(','),
            medicine: medicineList,
            appointmentId: id,
        };

        if (daignosis.length) obj["daignosis"] = daignosis.join(',');
        if (medicalCheckup.length) obj["test"] = medicalCheckup.join(',');
        if (followUpDate) obj["followUpdate"] = followUpDate;
        if (instruction?.trim()) obj["instruction"] = instruction.trim();

        createPrescription({ data: obj });
    }

    useEffect(() => {
        if (!isLoading && isError) {
            message.error(error?.data?.message || 'Failed to save prescription. Please verify appointment and patient details.');
        }
        if (isSuccess) {
            message.success('Successfully Changed Saved !');
            setSelectAppointmentStatus("");
            setPatientStatus("");
            setDaignosis([]);
            setDisease([]);
            setMedicalCheckup([]);
            setInstruction('');
            setFollowUpdate('');
            setMedicineList([{ id: 1 }]);
            navigate('/dashboard/prescription')
        }
    }, [isLoading, isError, error, isSuccess])

    return (
        <DashboardLayout>
            <TreatmentOverview data={data} />
            <div className="w-100 mb-3 rounded p-3 bg-gray-g">
                <div className="text-center mb-2 d-flex justify-content-center">
                    <h5 className="border-success border-bottom w-25 pb-2 border-5">Start Treatment</h5>
                </div>

                <form className="row form-row" onSubmit={handleSubmit(onSubmit)}>
                    <div className="col-md-6">
                        <div className="form-group mb-4">
                            <div className="mb-2">
                                <h6 className="card-title text-secondary">Change Appointment Status</h6>
                            </div>
                            <SelectForm
                                showSearch={true}
                                options={appointemntStatusOption}
                                setSelectData={setSelectAppointmentStatus}
                            />
                        </div>
                    </div>

                    <div className="col-md-6">
                        <div className="form-group mb-4">
                            <div className="mb-2">
                                <h6 className="card-title text-secondary">Change Patient Status</h6>
                            </div>
                            <SelectForm
                                showSearch={true}
                                options={PatientStatus}
                                setSelectData={setPatientStatus}
                            />
                        </div>
                    </div>

                    <div className="col-md-12">
                        <div className="card p-3 mb-3">
                            <h6 className="card-title text-secondary">Identify Disease & Symtomps</h6>

                            <div className="row">
                                <div className="col-md-6">
                                    <div className="form-group mb-3">
                                        <div>
                                            <label>Daignosis</label>
                                        </div>
                                        <SelectForm
                                            mode={true}
                                            options={DiagnosisOptions}
                                            setSelectData={setDaignosis}
                                        />
                                    </div>
                                </div>

                                <div className="col-md-6">
                                    <div className="form-group mb-3">
                                        <div>
                                            <label>Disease</label>
                                        </div>
                                        <SelectForm
                                            mode={true}
                                            options={DiseaseOptions}
                                            setSelectData={setDisease}
                                        />
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    <div className="col-md-12 mb-3">
                        <div className="card mb-2 p-3 mt-2">
                            <h6 className="card-title text-secondary">Medical Checkup</h6>
                            <div className="row form-row">
                                <div className="form-group mb-2 card-label">
                                    <label>Medical Checkup</label>
                                    <SelectForm
                                        mode={true}
                                        setSelectData={setMedicalCheckup}
                                        options={MedicalCheckupOptions}
                                    />
                                    <small className="form-text text-muted">Note : Type & Press enter to add new services</small>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-12">
                        <div className="card mb-2 p-3 mt-2">
                            <h6 className="card-title text-secondary">Medicine</h6>
                            {
                                medicineList?.map((item, index) => (
                                    <div className="row form-row mb-4 position-relative border border-success rounded m-2 p-2" key={index + 1}>
                                        <div className="col-md-6 mb-3">
                                            <label>Medicine Name</label>
                                            <div className="form-group mb-2">
                                                <InputAutoCompleteForm
                                                    id={item.id}
                                                    medicineList={medicineList}
                                                    setMedicineList={setMedicineList}
                                                />
                                            </div>
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label>Dosage</label>
                                            <div className="form-group mb-2">
                                                <SelectFormForMedicine
                                                    id={item.id}
                                                    keyName={"dosage"}
                                                    options={DosageOptions}
                                                    medicineList={medicineList}
                                                    setMedicineList={setMedicineList}
                                                />
                                            </div>
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label>Frequency</label>
                                            <div className="form-group mb-2">
                                                <SelectFormForMedicine
                                                    id={item.id}
                                                    keyName={"frequency"}
                                                    options={FrequencyOptions}
                                                    medicineList={medicineList}
                                                    setMedicineList={setMedicineList}
                                                />
                                            </div>
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label>Start Date / End Date</label>
                                            <div className="form-group mb-2">
                                                <Space direction="vertical" size={12}>
                                                    <MedicineRangePickerForm
                                                        id={item.id}
                                                        medicineList={medicineList}
                                                        setMedicineList={setMedicineList}
                                                    />

                                                </Space>
                                            </div>
                                        </div>

                                        <a className="text-danger position-absolute text-end mb-3"
                                            onClick={() => removeFromAddTimeSlot(item?.id)} style={{ top: '-35px' }}>
                                            <FaRegTrashAlt />
                                        </a>
                                    </div>
                                ))
                            }
                        </div>

                        <div className="mb-4" style={{ width: '120px' }}>
                            <Button type="primary" size='small' htmlType="button" onClick={addField} block icon={<FaPlus />}>
                                Add
                            </Button>
                        </div>
                    </div>

                    <div className="col-md-12 mb-3">
                        <label>Follow Up Date</label>
                        <div className="form-group mb-2">
                            <DatePicker
                                presets={DatePickerSinglePresets}
                                onChange={handleFollowUpChange}
                                showTime
                                size="large"
                                style={{ width: '100%' }}
                            />
                        </div>
                    </div>

                    <div className="col-md-12 mb-3">
                        <div className="form-group mb-2">
                            <label>Instruction</label>
                            <TextArea rows={4} placeholder="Instruction text ..." onChange={(e) => setInstruction(e.target.value)} />
                        </div>
                    </div>

                    <div className='text-center my-3'>
                        <Button htmlType='submit' type="primary" size='large' disabled={isDisable} loading={isLoading}>
                            Submit
                        </Button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    )
}

export default Treatment;