import { Outlet, useNavigate } from 'react-router-dom';
import { getUserInfo } from '../../service/auth.service';
import { useEffect } from 'react';

const PrivateOutlet = () => {
  const navigate = useNavigate();
  const localAuth = getUserInfo();
  
  useEffect(() => {
    if (!localAuth) {
      navigate('/login', { replace: true });
      return;
    }
    if (localAuth.role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
      return;
    }
    if (localAuth.role === 'super_admin') {
      navigate('/super-admin/dashboard', { replace: true });
    }
  }, [navigate])

  return localAuth?.role === 'patient' || localAuth?.role === 'doctor' ? <Outlet /> : null
};

export default PrivateOutlet;