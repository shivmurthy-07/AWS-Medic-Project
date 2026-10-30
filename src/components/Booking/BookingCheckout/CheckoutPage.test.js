import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CheckoutPage from './CheckoutPage';

const renderCheckout = (overrides = {}) => {
    const props = {
        isCheck: false,
        setIsChecked: jest.fn(),
        data: null,
        selectedDate: '',
        selectTime: '',
        paymentOption: 'demo',
        onPaymentOptionChange: jest.fn(),
        demoPaymentComplete: false,
        onDemoPaymentComplete: jest.fn(),
        ...overrides,
    };

    const view = render(
        <MemoryRouter>
            <CheckoutPage {...props} />
        </MemoryRouter>
    );
    return { ...view, props };
};

describe('booking checkout', () => {
    test('opens the terms and conditions without toggling acceptance', async () => {
        const { props } = renderCheckout();

        fireEvent.click(screen.getByRole('link', { name: 'Terms & Conditions' }));

        expect(await screen.findByText(/your booking is subject to the selected doctor/i)).toBeTruthy();
        expect(screen.getByRole('checkbox').checked).toBe(false);
    });

    test('accepts the terms when the checkbox is selected', () => {
        const { props } = renderCheckout();
        fireEvent.click(screen.getByRole('checkbox'));

        expect(props.setIsChecked).toHaveBeenCalledWith(true);
    });

    test('simulates a demo payment without returning card details', () => {
        const onDemoPaymentComplete = jest.fn();
        const { rerender, props } = renderCheckout({ onDemoPaymentComplete });
        const futureYear = String(new Date().getFullYear() + 1);

        fireEvent.change(screen.getByLabelText('Name on card'), { target: { value: 'Demo User' } });
        fireEvent.change(screen.getByLabelText('Dummy card number'), { target: { value: '4242 4242 4242 4242' } });
        fireEvent.change(screen.getByLabelText('Expiry month'), { target: { value: '12' } });
        fireEvent.change(screen.getByLabelText('Expiry year'), { target: { value: futureYear } });
        fireEvent.change(screen.getByLabelText('CVV'), { target: { value: '123' } });
        fireEvent.click(screen.getByRole('button', { name: 'Simulate demo payment' }));

        expect(onDemoPaymentComplete).toHaveBeenCalledTimes(1);
        expect(onDemoPaymentComplete).toHaveBeenCalledWith(true);
        expect(onDemoPaymentComplete.mock.calls).toEqual([[true]]);
        rerender(
            <MemoryRouter>
                <CheckoutPage {...props} demoPaymentComplete />
            </MemoryRouter>
        );
        expect(screen.getByRole('status').textContent).toMatch(/simulated only/i);
    });
});
