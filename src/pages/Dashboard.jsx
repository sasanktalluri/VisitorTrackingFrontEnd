import React, { useState, useEffect } from "react";
import axios from "axios";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Bar, Pie } from 'react-chartjs-2';
import { getAuthConfig } from "../utils/Auth";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';


ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard() {
    const userRole = localStorage.getItem("role");
    if (userRole === "RECEPTIONIST") {
      return (
        <div className="container mt-5 text-center">
          <h3>You are not authorized to view this page.</h3>
        </div>
      );
    }
    
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState({});
  const [weeklyRevenue, setWeeklyRevenue] = useState([]);
  const [serviceRevenue, setServiceRevenue] = useState([]);
  const [searchPhone, setSearchPhone] = useState("");
  const [visitorDetails, setVisitorDetails] = useState(null);
  const [lookupError, setLookupError] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [expandedCard, setExpandedCard] = useState(null); // "today" | "week" | "month"

  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerRole, setRegisterRole] = useState("RECEPTIONIST");
  const [registerMsg, setRegisterMsg] = useState("");

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const config = getAuthConfig();
      const statsRes = await axios.get("http://localhost:8080/api/dashboard/stats", config);
      const serviceRes = await axios.get("http://localhost:8080/api/dashboard/service-revenue", config);
      const weekRes = await axios.get("http://localhost:8080/api/dashboard/weekly-revenue", config);
      setStats(statsRes.data);
      setServiceRevenue(serviceRes.data);
      setWeeklyRevenue(weekRes.data);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  };

  const handleSearchPhone = async () => {
    try {
      setLookupError("");
      const config = getAuthConfig();
      const res = await axios.get(`http://localhost:8080/api/dashboard/details/${searchPhone}`, config);
      if (!res.data || !res.data.phoneNumber) {
        setLookupError("Visitor not found.");
        setVisitorDetails(null);
      } else {
        setVisitorDetails(res.data);
      }
    } catch (error) {
      setLookupError("Invalid phone number.");
      setVisitorDetails(null);
    }
  };

  const handleRegister = async () => {
    setRegisterMsg("");
    if (!registerUsername || !registerPassword) {
      setRegisterMsg("Please enter username and password.");
      return;
    }

    if (!["ADMIN", "RECEPTIONIST"].includes(registerRole)) {
      setRegisterMsg("Invalid role selected.");
      return;
    }

    try {
      const config = getAuthConfig();
      await axios.post("http://localhost:8080/api/auth/register", {
        username: registerUsername,
        password: registerPassword,
        role: registerRole
      }, config);
      setRegisterMsg("User registered successfully!");
      setRegisterUsername("");
      setRegisterPassword("");
      setRegisterRole("RECEPTIONIST"); // reset role too
    } catch (error) {
      if (error.response && error.response.status === 409) {
        setRegisterMsg("Username already taken.");
      } else {
        setRegisterMsg("Failed to register user.");
      }
    }
  };

  const handleCardClick = async (period) => {
    if (expandedCard === period) {
      setExpandedCard(null); 
      setTransactions([]);
      return;
    }

    setExpandedCard(period);
    try {
      const config = getAuthConfig();
      const res = await axios.get(`http://localhost:8080/api/dashboard/transactions?period=${period}`, config);
      setSelectedPeriod(period);
      setTransactions(res.data);
    } catch (err) {
      console.error("Error fetching transactions for", period, err);
    }
  };

  const weeklyBarData = {
    labels: weeklyRevenue.map(day => day.date),
    datasets: [
      {
        label: 'Revenue',
        data: weeklyRevenue.map(day => day.amount),
        backgroundColor: '#4e73df',
      }
    ]
  };

  const servicePieData = {
    labels: serviceRevenue.map(s => s.serviceType),
    datasets: [
      {
        data: serviceRevenue.map(s => s.total),
        backgroundColor: ['#36b9cc', '#f6c23e', '#e74a3b', '#1cc88a']
      }
    ]
  };

  return (
    <div className="d-flex">
      <div className="bg-dark text-white p-3" style={{ width: '220px', minHeight: '100vh' }}>
        <ul className="nav flex-column">
          <li className="nav-item mb-2">
            <button
              className={`btn btn-link nav-link text-white ${activeTab === 'dashboard' ? 'fw-bold' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </button>
          </li>
          <li className="nav-item mb-2">
            <button
              className={`btn btn-link nav-link text-white ${activeTab === 'visitors' ? 'fw-bold' : ''}`}
              onClick={() => setActiveTab('visitors')}
            >
              Visitors
            </button>
          </li>
          <li className="nav-item mb-2">
            <button
              className={`btn btn-link nav-link text-white ${activeTab === 'individual' ? 'fw-bold' : ''}`}
              onClick={() => setActiveTab('individual')}
            >
              Lookup
            </button>
          </li>
          <li className="nav-item mb-2">
            <button
              className={`btn btn-link nav-link text-white ${activeTab === 'register' ? 'fw-bold' : ''}`}
              onClick={() => setActiveTab('register')}
            >
              Register User
            </button>
          </li>
        </ul>
      </div>

      <div className="container-fluid p-4">
        {activeTab === "dashboard" && (
          <div>
            <h2 className="mb-4">Dashboard</h2>
            <div className="row mb-4">
              <div className="col-md-3">
                <div className="bg-light p-3 rounded cursor-pointer" onClick={() => handleCardClick('today')}>
                  <h6>Today</h6>
                  <p>${stats.todayRevenue}</p>
                </div>
              </div>
              <div className="col-md-3">
                <div className="bg-light p-3 rounded cursor-pointer" onClick={() => handleCardClick('week')}>
                  <h6>This Week</h6>
                  <p>${stats.weekRevenue}</p>
                </div>
              </div>
              <div className="col-md-3">
                <div className="bg-light p-3 rounded cursor-pointer" onClick={() => handleCardClick('month')}>
                  <h6>This Month</h6>
                  <p>${stats.monthRevenue}</p>
                </div>
              </div>
            </div>

            {expandedCard && selectedPeriod && (
              <div className="bg-white shadow-sm p-3 rounded mb-4">
                <h5 className="mb-3 text-capitalize">Transactions for {selectedPeriod}</h5>
                {transactions.length === 0 ? (
                  <p>No transactions found.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-bordered">
                      <thead className="table-light">
                        <tr>
                          <th>Visitor</th>
                          <th>Service Type</th>
                          <th>Amount</th>
                          <th>Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((t, idx) => (
                          <tr key={idx}>
                            <td>{t.visitorName}</td>
                            <td>{t.serviceType}</td>
                            <td>${t.amount}</td>
                            <td>{new Date(t.timestamp).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            <h5>Weekly Revenue</h5>
            <div className="mb-4" style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
              <Bar data={weeklyBarData} />
            </div>

            <h5>Revenue by Service</h5>
            <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}>
              <Pie data={servicePieData} />
            </div>
          </div>
        )}

        {activeTab === "visitors" && (
        <div>
            <h2>Visitors Check-ins</h2>
            <ul>
            <li>Today: {stats.todayVisitors}</li>
            <li>This Week: {stats.weekVisitors}</li>
            <li>This Month: {stats.monthVisitors}</li>
            </ul>
        </div>
        )}
        {activeTab === "individual" && (
        <div>
            <h2>Search by Phone Number</h2>
            <div className="d-flex gap-2 mb-3">
            <input
                className="form-control"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                placeholder="Phone Number"
            />
            <button className="btn btn-primary" onClick={handleSearchPhone}>
                Search
            </button>
            </div>

            {lookupError && <div className="alert alert-warning">{lookupError}</div>}

            {visitorDetails && (
            <div>
                <h6>Visitor Info</h6>
                <p><strong>Name:</strong> {visitorDetails.name}</p>
                <p><strong>Phone:</strong> {visitorDetails.phoneNumber}</p>
                <p><strong>Address:</strong> {visitorDetails.address}</p>

                <h6>Visits</h6>
                <ul>
                {visitorDetails.visits.map((visit, idx) => (
                    <li key={idx}>
                    Check-in: {visit.inTime} | Check-out: {visit.outTime || "Ongoing"}
                    </li>
                ))}
                </ul>

                <h6>Payments</h6>
                <ul>
                {visitorDetails.payments.map((pay, idx) => (
                    <li key={idx}>
                    {pay.category} - {pay.serviceType} - ${pay.amount}
                    </li>
                ))}
                </ul>

                <h6>Services</h6>
                <ul>
                {visitorDetails.services.map((srv, idx) => (
                    <li key={idx}>
                    {srv.serviceType} on {srv.timestamp}
                    </li>
                ))}
                </ul>
            </div>
            )}
        </div>
        )}


        {activeTab === "register" && (
          <div>
            <h2>Register User</h2>
            <div className="mb-3">
              <input
                className="form-control mb-2"
                placeholder="Username"
                value={registerUsername}
                onChange={(e) => setRegisterUsername(e.target.value)}
              />
              <input
                className="form-control mb-2"
                type="password"
                placeholder="Password"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
              />
              <select
                className="form-control mb-3"
                value={registerRole}
                onChange={(e) => setRegisterRole(e.target.value)}
              >
                <option value="RECEPTIONIST">RECEPTIONIST</option>
                <option value="ADMIN">ADMIN</option>
              </select>
              <button className="btn btn-success" onClick={handleRegister}>Register</button>
              {registerMsg && <div className="mt-2 alert alert-info">{registerMsg}</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
