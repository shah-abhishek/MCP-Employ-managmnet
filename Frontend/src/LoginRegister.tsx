import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:8000/api/v1/auth';

export default function LoginRegister() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

interface FormState {
    username: string;
    email: string;
    password: string;
    full_name: string;
}

interface InputChangeEvent extends React.ChangeEvent<HTMLInputElement> {}

const handleChange = (e: InputChangeEvent) => {
    setForm({ ...form, [e.target.name]: e.target.value });
};

interface LoginForm {
    username: string;
    password: string;
}

interface RegisterForm extends LoginForm {
    email: string;
    full_name: string;
}

interface ApiResponse {
    access_token?: string;
    detail?: string;
}

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
        if (isLogin) {
            // Login
            const params = new URLSearchParams();
            params.append('username', form.username);
            params.append('password', form.password);
            const res = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params.toString(),
            });
            const data: ApiResponse = await res.json();
            if (res.ok) {
                setMessage('Login successful!');
                localStorage.setItem('token', data.access_token as string);
        setTimeout(() => navigate('/chat'), 500);
            } else {
                setMessage(data.detail || 'Login failed');
            }
        } else {
            // Register
            const res = await fetch(`${API_BASE}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    // Save as employ (add role or type if needed)
                }),
            });
            const data: ApiResponse = await res.json();
            if (res.ok) {
                setMessage('Registration successful! You can now log in.');
                setIsLogin(true);
            } else {
                setMessage(data.detail || 'Registration failed');
            }
        }
    } catch (err) {
        setMessage('Network error');
    } finally {
        setLoading(false);
    }
};

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
      <h2 style={{ textAlign: 'center' }}>{isLogin ? 'Login' : 'Register as Employ'}</h2>
      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <>
            <input
              name="full_name"
              placeholder="Full Name"
              value={form.full_name}
              onChange={handleChange}
              required
              style={{ width: '100%', marginBottom: 8, padding: 8 }}
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
              style={{ width: '100%', marginBottom: 8, padding: 8 }}
            />
          </>
        )}
        <input
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
          required
          style={{ width: '100%', marginBottom: 8, padding: 8 }}
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
          style={{ width: '100%', marginBottom: 8, padding: 8 }}
        />
        <button type="submit" disabled={loading} style={{ width: '100%', padding: 10, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 600 }}>
          {loading ? 'Please wait...' : isLogin ? 'Login' : 'Register'}
        </button>
      </form>
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <button onClick={() => setIsLogin(!isLogin)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer' }}>
          {isLogin ? 'No account? Register as Employ' : 'Already have an account? Login'}
        </button>
      </div>
      {message && <div style={{ marginTop: 16, color: message.includes('success') ? 'green' : 'red', textAlign: 'center' }}>{message}</div>}
    </div>
  );
}
