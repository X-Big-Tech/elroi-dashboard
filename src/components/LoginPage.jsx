import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('signin'); // 'signin' or 'signup'
  
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (mode === 'signin') {
        const { error } = await authService.signIn(email, password);
        if (error) throw error;
        navigate('/dashboard');
      } else {
        const { error } = await authService.signUp(email, password);
        if (error) throw error;
        setMode('confirmation');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setError(error.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-700 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-8 sm:p-10">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-1">
              {mode === 'signin' ? 'Sign in to your account' : 
               mode === 'signup' ? 'Create an account' : 
               'Check your email'}
            </h2>
            <p className="text-sm text-gray-500">
              {mode === 'signin' ? 'Or ' : 
               mode === 'signup' ? 'Already have an account? ' : 
               'A confirmation link has been sent to your email'}
              {mode !== 'confirmation' && (
                <button 
                  className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none"
                  onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                >
                  {mode === 'signin' ? 'create a new account' : 'sign in to your account'}
                </button>
              )}
            </p>
          </div>

          {mode === 'confirmation' ? (
            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Please check your email for a confirmation link. Once confirmed, you can sign in to your account.
              </p>
              <button
                className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => setMode('signin')}
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleAuth}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    mode === 'signin' ? 'Sign in' : 'Sign up'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
        
        <div className="px-6 py-4 bg-gray-50 border-t-2 border-gray-100 sm:px-10">
          <p className="text-xs text-center text-gray-500">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 