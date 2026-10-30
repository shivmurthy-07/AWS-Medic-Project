import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import swal from 'sweetalert';
import SignUp from './SignUp';

const mockDoctorSignup = jest.fn();
let mockDoctorSignupState;

jest.mock('../../redux/api/authApi', () => ({
    useDoctorSignUpMutation: () => [mockDoctorSignup, mockDoctorSignupState],
    usePatientSignUpMutation: () => [jest.fn(), {
        data: null,
        isSuccess: false,
        isError: false,
        error: null,
        isLoading: false,
    }],
}));

jest.mock('sweetalert', () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock('antd', () => ({
    message: { error: jest.fn() },
}));

describe('doctor registration approval message', () => {
    beforeEach(() => {
        mockDoctorSignup.mockClear();
        swal.mockClear();
        mockDoctorSignupState = {
            data: null,
            isSuccess: false,
            isError: false,
            error: null,
            isLoading: false,
        };
    });

    test('shows the Super Admin approval popup after successful doctor signup', async () => {
        const { rerender } = render(<SignUp setSignUp={jest.fn()} />);

        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'doctor' } });
        fireEvent.change(screen.getByRole('combobox', { name: 'Specialization' }), { target: { value: 'Cardiologist' } });
        fireEvent.change(screen.getByPlaceholderText('First name'), { target: { value: 'Avery' } });
        fireEvent.change(screen.getByPlaceholderText('Last name'), { target: { value: 'Doctor' } });
        fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'avery@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('Create a password'), { target: { value: 'ValidPass1!' } });
        fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));
        expect(mockDoctorSignup).toHaveBeenCalledWith({
            firstName: 'Avery',
            lastName: 'Doctor',
            email: 'avery@example.com',
            password: 'ValidPass1!',
            specialization: 'Cardiologist',
        });

        mockDoctorSignupState = { ...mockDoctorSignupState, isSuccess: true };
        rerender(<SignUp setSignUp={jest.fn()} />);

        await waitFor(() => expect(swal).toHaveBeenCalledWith({
            icon: 'success',
            text: 'Registration Successful! Your account is waiting for Super Admin approval. You will be able to log in after your account is approved.',
            timer: 5000,
        }));
    });

    test('notifies the parent when the selected account type changes', () => {
        const onUserTypeChange = jest.fn();
        render(<SignUp setSignUp={jest.fn()} userType="patient" onUserTypeChange={onUserTypeChange} />);

        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'doctor' } });

        expect(onUserTypeChange).toHaveBeenCalledWith('doctor');
    });

    test('toggles password visibility', () => {
        render(<SignUp setSignUp={jest.fn()} />);
        const passwordInput = screen.getByLabelText('Create a password');

        expect(passwordInput.type).toBe('password');
        fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
        expect(passwordInput.type).toBe('text');
        fireEvent.click(screen.getByRole('button', { name: 'Hide password' }));
        expect(passwordInput.type).toBe('password');
    });

    test('explains that doctor sign-in only requires Super Admin approval', () => {
        render(<SignUp setSignUp={jest.fn()} />);

        expect(screen.queryByRole('combobox', { name: 'Specialization' })).toBeNull();
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'doctor' } });

        expect(screen.getByText('Doctor accounts require Super Admin approval before sign-in.')).toBeTruthy();
        expect(screen.getByRole('combobox', { name: 'Specialization' })).toBeTruthy();
        expect(screen.queryByText(/email verification/i)).toBeNull();
    });
});
