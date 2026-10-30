import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { getUserInfo } from '../../service/auth.service';

const SuperAdminPrivateOutlet = () => {
    const navigate = useNavigate();
    const auth = getUserInfo();

    useEffect(() => {
        if (auth?.role !== 'super_admin') {
            navigate(auth?.role === 'admin' ? '/admin/dashboard' : '/super-admin/login', { replace: true });
        }
    }, [auth?.role, navigate]);

    return auth?.role === 'super_admin' ? <Outlet /> : null;
};

export default SuperAdminPrivateOutlet;
