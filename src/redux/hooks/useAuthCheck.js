import { useEffect, useState } from "react";
import { useGetDoctorQuery } from "../api/doctorApi";
import { useGetPatientQuery } from "../api/patientApi";
import { getUserInfo } from '../../service/auth.service';

export default function useAuthCheck() {
    const initialAuth = getUserInfo();
    const [authChecked, setAuthChecked] = useState(initialAuth?.role === 'admin');
    const [userId, setUserId] = useState(initialAuth?.userId || '');
    const [isSkip, setIsSkip] = useState(!initialAuth || initialAuth.role === 'admin');
    const [data, setData] = useState({});
    const [role, setRole] = useState(initialAuth?.role || '');
    const { data: doctorData, isError, isSuccess: dIsSuccess } = useGetDoctorQuery(userId, { skip: isSkip || role !== 'doctor' });
    const { data: patientData, isError: pIsError, isSuccess: pIsSuccess } = useGetPatientQuery(userId, { skip: isSkip || role !== 'patient' });

    useEffect(() => {
        const localAuth = getUserInfo();

        if (!localAuth) {
            setIsSkip(true);
            setUserId('');
            setData({});
            setRole('');
            setAuthChecked(false);
            return;
        }

        if (localAuth.role === 'admin') {
            setUserId('');
            setIsSkip(true);
            setData({});
            setRole('admin');
            setAuthChecked(true);
            return;
        }

        if (localAuth.role === 'patient') {
            setUserId(localAuth?.userId);
            setIsSkip(false);
            setData(patientData);
            setRole(localAuth.role);
            setAuthChecked(pIsSuccess && !pIsError);
        } else if (localAuth.role === 'doctor') {
            setUserId(localAuth?.userId);
            setIsSkip(false);
            setData(doctorData);
            setRole(localAuth.role);
            setAuthChecked(dIsSuccess && !isError);
        }
    }, [patientData, doctorData, isError, dIsSuccess, pIsError, pIsSuccess]);

    return {
        authChecked,
        data,
        role
    };
}