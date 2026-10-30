export const setUserInfo = ({accessToken}) =>{
    if (typeof accessToken !== 'string' || !accessToken.trim()) {
        return '';
    }
    return setSessionStorage('accessToken', accessToken);
}

export const setLocalStorage = (key, token) => {
    if (!key || typeof window === 'undefined') {
        return ''
    }
    return localStorage.setItem(key, token)
}

export const getFromLocalStorage = (key) => {
    if (!key || typeof window === 'undefined') {
        return ''
    }
    const value = localStorage.getItem(key);
    return value && value !== 'undefined' && value !== 'null' ? value : '';
}

export const setSessionStorage = (key, value) => {
    if (!key || typeof window === 'undefined') {
        return '';
    }
    return window.sessionStorage.setItem(key, value);
}

export const getFromSessionStorage = (key) => {
    if (!key || typeof window === 'undefined') {
        return '';
    }
    const value = window.sessionStorage.getItem(key);
    return value && value !== 'undefined' && value !== 'null' ? value : '';
}