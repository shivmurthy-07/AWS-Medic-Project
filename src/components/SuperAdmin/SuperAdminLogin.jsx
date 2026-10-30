import { Button, Card, Form, Input, message } from 'antd';
import { FaLock, FaUserShield } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { useUserLoginMutation } from '../../redux/api/authApi';
import { loggedOut } from '../../service/auth.service';
import './SuperAdmin.css';

const SuperAdminLogin = () => {
    const navigate = useNavigate();
    const [login, { isLoading }] = useUserLoginMutation();

    const onFinish = async (credentials) => {
        try {
            const result = await login(credentials).unwrap();
            if (result?.user?.role !== 'super_admin') {
                loggedOut();
                message.error('This sign-in is only for Super Admin accounts.');
                return;
            }
            message.success('Signed in successfully.');
            navigate('/super-admin/dashboard', { replace: true });
        } catch (error) {
            message.error(error?.data?.message || 'Unable to sign in. Check your credentials and try again.');
        }
    };

    return (
        <main className="super-admin-login">
            <Card className="super-admin-login__card">
                <div className="super-admin-login__icon"><FaUserShield /></div>
                <h1>Platform administration</h1>
                <p>Sign in with the Super Admin account provisioned for this platform.</p>
                <Form layout="vertical" onFinish={onFinish}>
                    <Form.Item name="email" label="Email or username" rules={[{ required: true }, { max: 254 }]}>
                        <Input autoComplete="username" />
                    </Form.Item>
                    <Form.Item name="password" label="Password" rules={[{ required: true }]}>
                        <Input.Password prefix={<FaLock />} autoComplete="current-password" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" loading={isLoading} block>Sign in securely</Button>
                </Form>
                <Link to="/login" className="super-admin-login__back">Return to regular sign in</Link>
            </Card>
        </main>
    );
};

export default SuperAdminLogin;
