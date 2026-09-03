export const API_ROOT_URL = import.meta.env.VITE_API_ROOT_URL ||
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://127.0.0.1:5000'
        : 'https://sanjivani-farmbackend.onrender.com');

export const API_BASE_URL = `${API_ROOT_URL}/api`;

// Send OTP to user's email
export const sendOTP = async (userEmail) => {
    try {
        const response = await fetch(`${API_BASE_URL}/send-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: userEmail }),
        });

        const data = await response.json();
        return data; // returns { success: true, otp: "123456", message: "..." }
    } catch (error) {
        console.error('Error sending OTP:', error);
        return { success: false, message: 'Server error. Is Flask running?' };
    }
};

// Send Promotional / Offer / Order Emails
export const sendNotification = async (userEmail, subject, message) => {
    try {
        const response = await fetch(`${API_BASE_URL}/send-notification`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: userEmail,
                subject: subject,
                message: message,
            }),
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error sending notification:', error);
        return { success: false, message: 'Server error.' };
    }
};
