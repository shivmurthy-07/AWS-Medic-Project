import {authKey} from '../constant/storageKey';
import {decodeToken} from '../utils/jwt';
import { getFromSessionStorage, setSessionStorage } from '../utils/local-storage';
export const setUserInfo = ({ accessToken }) => {
    return setSessionStorage(authKey, accessToken);
}

export const getUserInfo = () => {
    const authToken = getFromSessionStorage(authKey);
    if (authToken) {
        try {
            const decodedToken = decodeToken(authToken);
            if (decodedToken.exp && decodedToken.exp * 1000 <= Date.now()) {
                loggedOut();
                return null;
            }
            return decodedToken;
        } catch (error) {
            loggedOut();
            return null;
        }
    } else {
        return null
    }
}
export const isLoggedIn = () => {
    const authToken = getFromSessionStorage(authKey);
    return !!authToken;
}
export const loggedOut = () => {
    return window.sessionStorage.removeItem(authKey)
}