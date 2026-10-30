import { authKey } from '../constant/storageKey';
import { getUserInfo, loggedOut, setUserInfo } from './auth.service';

const patientToken = 'eyJhbGciOiJub25lIn0.eyJyb2xlIjoicGF0aWVudCIsInVzZXJJZCI6InBhdGllbnQtaWQifQ.';

describe('tab-scoped authentication', () => {
    beforeEach(() => {
        window.sessionStorage.clear();
        window.localStorage.clear();
    });

    test('stores the signed-in user in this tab session, not shared local storage', () => {
        setUserInfo({ accessToken: patientToken });

        expect(window.sessionStorage.getItem(authKey)).toBe(patientToken);
        expect(window.localStorage.getItem(authKey)).toBeNull();
        expect(getUserInfo()).toMatchObject({ role: 'patient', userId: 'patient-id' });
    });

    test('ignores legacy shared tokens and logs out only this tab', () => {
        window.localStorage.setItem(authKey, patientToken);
        expect(getUserInfo()).toBeNull();

        setUserInfo({ accessToken: patientToken });
        loggedOut();

        expect(window.sessionStorage.getItem(authKey)).toBeNull();
        expect(window.localStorage.getItem(authKey)).toBe(patientToken);
        expect(getUserInfo()).toBeNull();
    });
});
