import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

/**
 * Reset Password Component
 * Handles the verification of the link and the actual password update.
 */
const ResetPassword = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isValidToken, setIsValidToken] = useState(false);
    const [isVerifying, setIsVerifying] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    
    // Requirement: retrieve the random string
    const { token } = useParams(); 
    const navigate = useNavigate();

    // Requirement: Check if the random string matches.
    useEffect(() => {
        const verifyToken = async () => {
            try {
                await axios.get(`http://localhost:5000/api/reset-password/${token}`);
                // Requirement: If the string matches show the password reset form.
                setIsValidToken(true);
            } catch (err) {
                // Requirement: If the string does not match send an error message.
                setError(err.response?.data?.message || 'Invalid or expired token');
                setIsValidToken(false);
            } finally {
                setIsVerifying(false);
            }
        };
        verifyToken();
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords don't match.");
            return;
        }

        try {
            // Requirement: Store the new password and clear the random string in the DB
            const res = await axios.post('http://localhost:5000/api/reset-password', {
                token,
                newPassword
            });
            setMessage(res.data.message);
            setError('');
            
            // Redirect after success
            setTimeout(() => {
                navigate('/');
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong');
            setMessage('');
        }
    };

    if (isVerifying) {
        return (
            <div className="container mt-5 text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3">Verifying your link...</p>
            </div>
        );
    }

    // Requirement: If the string does not match send an error message (Alert).
    if (error && !isValidToken) {
        return (
            <div className="container mt-5">
                <div className="row justify-content-center">
                    <div className="col-md-6">
                        <div className="alert alert-danger text-center shadow-sm p-4">
                            <i className="bi bi-x-circle-fill text-danger mb-3" style={{ fontSize: '2rem' }}></i>
                            <h4>Access Denied</h4>
                            <p className="mb-0">{error}</p>
                            <a href="/" className="btn btn-outline-danger mt-3">Go to Home</a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-5">
                    <div className="card p-4">
                        <div className="card-body">
                            <h3 className="card-title text-center">Reset Password</h3>
                            <p className="text-center text-muted mb-4">Create a new, strong password for your account.</p>

                            {message && (
                                <div className="alert alert-success d-flex align-items-center">
                                    <i className="bi bi-check-circle-fill me-2"></i>
                                    {message}
                                </div>
                            )}
                            {error && isValidToken && (
                                <div className="alert alert-danger d-flex align-items-center">
                                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                    {error}
                                </div>
                            )}
                            
                            {/* Requirement: If the string matches show the password reset form. */}
                            {isValidToken && (
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <label className="form-label fw-medium">New Password</label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-light"><i className="bi bi-lock"></i></span>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                className="form-control"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                required
                                                placeholder="Enter new password"
                                            />
                                            <button 
                                                className="btn btn-outline-secondary" 
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <label className="form-label fw-medium">Confirm Password</label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-light"><i className="bi bi-lock-fill"></i></span>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                className="form-control"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                                placeholder="Confirm new password"
                                            />
                                        </div>
                                    </div>
                                    <button type="submit" className="btn btn-primary w-100 py-2">Update Password</button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
