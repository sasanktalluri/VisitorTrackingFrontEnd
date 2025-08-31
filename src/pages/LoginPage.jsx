import React, { useState } from 'react';
import axios from 'axios';


export default function LoginPage() {
const [username, setUsername] = useState("");
const [password, setPassword] = useState("");
const [error, setError] = useState("");


const handleLogin = async () => {
try {
const res = await axios.post("http://localhost:8080/api/auth/login", { username, password });
localStorage.setItem("token", res.data.token);
localStorage.setItem("role", res.data.role); 
localStorage.setItem("username", res.data.username);
window.location.href = "/receptionist";
} catch (e) {
setError("Invalid credentials");
}
};


return (
<div className="container mt-5" style={{ maxWidth: '400px' }}>
<h3 className="mb-3 text-center">Login</h3>
{error && <div className="alert alert-danger">{error}</div>}
<input className="form-control mb-2" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
<input className="form-control mb-3" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
<button className="btn btn-primary w-100" onClick={handleLogin}>Login</button>
</div>
);
}