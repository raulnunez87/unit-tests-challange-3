'use client'

import { useState } from 'react'

export default function Home() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testRegister = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/register-mock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          username: 'testuser',
          password: 'SecurePass123!',
          confirmPassword: 'SecurePass123!'
        })
      })
      
      const data = await response.json()
      setResult(`Registration Response (${response.status}):\n${JSON.stringify(data, null, 2)}`)
    } catch (error) {
      setResult(`Registration Error:\n${error}`)
    }
    setLoading(false)
  }

  const testLogin = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/login-mock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'SecurePass123!'
        })
      })
      
      const data = await response.json()
      setResult(`Login Response (${response.status}):\n${JSON.stringify(data, null, 2)}`)
    } catch (error) {
      setResult(`Login Error:\n${error}`)
    }
    setLoading(false)
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🔐 Authentication API Test</h1>
      <p>This is a test page for the secure authentication module.</p>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Available Endpoints:</h2>
        <ul>
          <li><code>POST /api/auth/register</code> - User registration</li>
          <li><code>POST /api/auth/login</code> - User login</li>
        </ul>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Test API Endpoints:</h2>
        <button 
          onClick={testRegister} 
          disabled={loading}
          style={{ 
            marginRight: '10px', 
            padding: '10px 20px',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Testing...' : 'Test Registration'}
        </button>
        
        <button 
          onClick={testLogin} 
          disabled={loading}
          style={{ 
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Testing...' : 'Test Login'}
        </button>
      </div>

      {result && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#f5f5f5', 
          borderRadius: '5px',
          border: '1px solid #ddd'
        }}>
          <h3>Response:</h3>
          <pre style={{ 
            whiteSpace: 'pre-wrap', 
            wordBreak: 'break-word',
            backgroundColor: '#fff',
            padding: '10px',
            borderRadius: '3px',
            border: '1px solid #ccc'
          }}>
            {result}
          </pre>
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#e7f3ff', borderRadius: '5px' }}>
        <h3>📝 Note:</h3>
        <p>
          <strong>This is an API-only project.</strong> The authentication module provides secure 
          endpoints for user registration and login. To use it in a real application, you would:
        </p>
        <ol>
          <li>Set up MongoDB database</li>
          <li>Configure environment variables</li>
          <li>Integrate the API endpoints into your frontend application</li>
          <li>Handle JWT tokens for authenticated requests</li>
        </ol>
      </div>
    </div>
  )
}
