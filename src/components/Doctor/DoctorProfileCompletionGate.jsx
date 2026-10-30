import React, { useMemo } from 'react';
import { Alert, Progress, Spin } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { useGetDoctorQuery } from '../../redux/api/doctorApi';
import { getUserInfo } from '../../service/auth.service';
import { getDoctorProfileProgress } from '../../utils/doctorProfileCompletion';

/**
 * Provides profile optimization guidance without blocking dashboard navigation.
 */
const DoctorProfileCompletionGate = ({ children }) => {
    const location = useLocation();
    const onProfileSettings = location.pathname.includes('/dashboard/profile-setting');

    const auth = getUserInfo();
    const userId = auth?.userId;
    const isDoctor = auth?.role === 'doctor';

    const { data: doctor, isLoading, isFetching } = useGetDoctorQuery(userId, {
        skip: !isDoctor || !userId,
    });

    const { percent, missing, complete } = useMemo(
        () => getDoctorProfileProgress(doctor),
        [doctor]
    );

    if (!isDoctor) {
        return children;
    }

    if (isLoading && !doctor) {
        return (
            <div className="d-flex justify-content-center align-items-center py-5">
                <Spin size="large" />
            </div>
        );
    }

    return (
        <>
            {!complete && (
                <Alert
                    className="mb-3"
                    type={onProfileSettings ? "warning" : "info"}
                    showIcon
                    closable={!onProfileSettings}
                    message={onProfileSettings ? "Complete Your Profile" : "Profile Optimization Notice"}
                    description={
                        <div>
                            <div className="mb-2">
                                <strong>Profile is {percent}% complete.</strong>{' '}
                                {missing && missing.length > 0 && `Recommended to fill: ${missing.join(', ')}.`}
                            </div>
                            <Progress percent={percent} size="small" status={complete ? "success" : "active"} />
                            {!onProfileSettings && (
                                <div className="mt-2 text-end">
                                    <Link to="/dashboard/profile-setting" className="btn btn-sm btn-outline-primary">
                                        Update Profile Details
                                    </Link>
                                </div>
                            )}
                        </div>
                    }
                />
            )}
            {children}
        </>
    );
};

export default DoctorProfileCompletionGate;
