import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Check, User, Mail, Lock, Calendar, Globe, UserCheck, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import './Register.css';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    email: '',
    password: '',
    dob: '',
    gender: 'male',
    country: '',
    username: '',
    otp: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.name || !formData.lastName || !formData.email || !formData.password || !formData.dob || !formData.country) {
        return setError('Please fill all required fields');
      }
      setStep(2);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username) return setError('Username is required');
    
    setLoading(true);
    setError('');
    
    try {
      const { data } = await api.registerUser(formData);
      if (data.success) {
        setStep(3);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!formData.otp) return setError('OTP is required');
    
    setLoading(true);
    setError('');
    
    try {
      const { data } = await api.verifyOtp({
        email: formData.email,
        otp: formData.otp
      });
      if (data.success) {
        // If your backend returns tokens after OTP, login directly
        if (data.accessToken) {
          login(data);
          navigate('/chat');
        } else {
          navigate('/login');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card glass-panel">
        <div className="register-header">
          <h2>
            {step === 1 && 'Create Account'}
            {step === 2 && 'Choose Username'}
            {step === 3 && 'Verify Email'}
          </h2>
          <p className="subtitle">
            {step === 1 && 'Enter your personal details to get started.'}
            {step === 2 && 'Pick a unique username for your profile.'}
            {step === 3 && 'Enter the 6-digit OTP sent to your email.'}
          </p>
          
          {/* Step Indicators */}
          <div className="step-indicator">
            <div className={`step-dot ${step >= 1 ? 'active' : ''}`}>1</div>
            <div className={`step-line ${step >= 2 ? 'active' : ''}`}></div>
            <div className={`step-dot ${step >= 2 ? 'active' : ''}`}>2</div>
            <div className={`step-line ${step >= 3 ? 'active' : ''}`}></div>
            <div className={`step-dot ${step >= 3 ? 'active' : ''}`}>3</div>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="register-body">
          {step === 1 && (
            <form onSubmit={(e) => { e.preventDefault(); nextStep(); }}>
              <div className="form-row">
                <div className="input-group">
                  <label>First Name</label>
                  <div className="input-with-icon">
                    <User className="input-icon" size={18} />
                    <input type="text" name="name" className="input-field" value={formData.name} onChange={handleChange} required placeholder="John" />
                  </div>
                </div>
                <div className="input-group">
                  <label>Last Name</label>
                  <input type="text" name="lastName" className="input-field" value={formData.lastName} onChange={handleChange} required placeholder="Doe" />
                </div>
              </div>
              
              <div className="input-group">
                <label>Email Address</label>
                <div className="input-with-icon">
                  <Mail className="input-icon" size={18} />
                  <input type="email" name="email" className="input-field" value={formData.email} onChange={handleChange} required placeholder="john@example.com" />
                </div>
              </div>
              
              <div className="input-group">
                <label>Password</label>
                <div className="input-with-icon">
                  <Lock className="input-icon" size={18} />
                  <input type="password" name="password" className="input-field" value={formData.password} onChange={handleChange} required placeholder="••••••••" />
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label>Date of Birth</label>
                  <div className="input-with-icon">
                    <Calendar className="input-icon" size={18} />
                    <input type="date" name="dob" className="input-field" value={formData.dob} onChange={handleChange} required />
                  </div>
                </div>
                <div className="input-group">
                  <label>Gender</label>
                  <select name="gender" className="input-field" value={formData.gender} onChange={handleChange}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label>Country</label>
                <div className="input-with-icon">
                  <Globe className="input-icon" size={18} />
                  <input type="text" name="country" className="input-field" value={formData.country} onChange={handleChange} required placeholder="United States" />
                </div>
              </div>

              <button type="submit" className="btn-primary">
                Next <ChevronRight size={18} style={{ verticalAlign: 'middle', marginLeft: '5px' }} />
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleRegisterSubmit}>
              <div className="input-group">
                <label>Username</label>
                <div className="input-with-icon">
                  <UserCheck className="input-icon" size={18} />
                  <input type="text" name="username" className="input-field" value={formData.username} onChange={handleChange} required placeholder="johndoe123" />
                </div>
                <p className="help-text">This is how your friends will find you.</p>
              </div>

              <div className="btn-row">
                <button type="button" className="btn-secondary" onClick={() => setStep(1)}>Back</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Register'}
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleVerifyOTP}>
              <div className="input-group">
                <label>6-Digit OTP</label>
                <div className="input-with-icon">
                  <Shield className="input-icon" size={18} />
                  <input type="text" name="otp" className="input-field" value={formData.otp} onChange={handleChange} required placeholder="Enter OTP" maxLength="6" style={{ letterSpacing: '4px', textAlign: 'center', fontSize: '1.2rem', paddingLeft: '0' }} />
                </div>
                <p className="help-text">We sent an OTP to {formData.email}</p>
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify & Login'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
