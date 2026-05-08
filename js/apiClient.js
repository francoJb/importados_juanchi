export async function apiFetch(url, options = {}) {
    const token = sessionStorage.getItem('authToken');

    const headers = {
        ...(options.headers || {})
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers
    });

    if (response.status === 401) {
        sessionStorage.removeItem('loggedIn');
        sessionStorage.removeItem('authToken');
        alert('La sesión venció o no es válida. Iniciá sesión nuevamente.');
        location.reload();
        return response;
    }

    return response;
}