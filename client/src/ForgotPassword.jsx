import React, { useState } from 'react';
// import axios from 'axios';  <-- Ise hata diya
import API from './api'; // <-- Aapka naya axios instance

/**
 * Forgot Password Component
 * Corresponds to "Design a forget password page" in requirements.
 */
const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            // Ab 'http://localhost:5000/api' likhne ki zarurat nahi
            // API instance automatically base URL add kar dega
            const res = await API.post('/forgot-password', { email });
            setMessage(res.data.message);
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-5">
                    <div className="card p-4 shadow-sm"> {/* Added shadow for better look */}
                        <div className="card-body">
                            <div className="text-center mb-4">
                                <i className="bi bi-shield-lock text-primary" style={{ fontSize: '3rem' }}></i>
                                <h3 className="card-title mt-2">Forgot Password?</h3>
                                <p className="text-muted">Enter your email and we'll send you a link to reset your password.</p>
                            </div>

                            {/* Success Message */}
                            {message && (
                                <div className="alert alert-success d-flex align-items-center" role="alert">
                                    <i className="bi bi-check-circle-fill me-2"></i>
                                    <div>{message}</div>
                                </div>
                            )}

                            {/* Error Message */}
                            {error && (
                                <div className="alert alert-danger d-flex align-items-center" role="alert">
                                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                    <div>{error}</div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="mb-4">
                                    <label className="form-label fw-medium">Email Address</label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-light"><i className="bi bi-envelope"></i></span>
                                        <input
                                            type="email"
                                            className="form-control"
                                            placeholder="name@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-primary w-100" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Sending Link...
                                        </>
                                    ) : (
                                        'Send Reset Link'
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;