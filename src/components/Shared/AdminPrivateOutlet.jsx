import { Outlet, useNavigate } from 'react-router-dom';
import { getUserInfo } from '../../service/auth.service';
import { useEffect } from 'react';

const AdminPrivateOutlet = () => {
    const navigate = useNavigate();
    const localAuth = getUserInfo();

    useEffect(() => {
        if (!localAuth) {
            navigate('/login', { replace: true });
            return;
        }
        if (localAuth.role !== 'admin') {
            navigate('/', { replace: true });
        }
    }, [navigate]);

    return localAuth?.role === 'admin' ? <Outlet /> : null;
};

export default AdminPrivateOutlet;
