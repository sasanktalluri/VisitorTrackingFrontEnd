import React, { useState, useEffect } from "react";
import axios from "axios";
import 'bootstrap/dist/css/bootstrap.min.css';

export default function ReceptionistPanel() {
  const [visitors, setVisitors] = useState([]);
  const [newVisitor, setNewVisitor] = useState({ name: "", phoneNumber: "", address: "", role: "Customer" });
  const [checkInPhone, setCheckInPhone] = useState("");
  const [activeSection, setActiveSection] = useState("register");
  const [service, setService] = useState({ phoneNumber: "", name: "", serviceType: "" });
  const [payment, setPayment] = useState({ name: "", phoneNumber: "", category: "", serviceType: "", amount: "" });

  const headers = {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, []);

  const fetchVisitors = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/visitors", headers);
      setVisitors(res.data);
    } catch (error) {
      console.error("Error fetching visitors:", error);
    }
  };

  const handleRegisterVisitor = async () => {
    try {
      await axios.post("http://localhost:8080/api/visitors/register", newVisitor, headers);
      alert("Visitor registered");
      setNewVisitor({ name: "", phoneNumber: "", address: "", role: "Customer" });
      fetchVisitors();
    } catch (error) {
      alert("Registration failed");
    }
  };

  const handleCheckIn = async () => {
    try {
      await axios.post("http://localhost:8080/api/visits/checkin", { phoneNumber: checkInPhone }, headers);
      alert("Checked in");
    } catch (error) {
      alert("Check-in failed");
    }
  };

  const handleCheckOut = async () => {
    try {
      await axios.post(`http://localhost:8080/api/visits/checkout/${checkInPhone}`, {}, headers);
      alert("Checked out");
    } catch (error) {
      alert("Checkout failed");
    }
  };

  const handleAddService = async () => {
    try {
      await axios.post("http://localhost:8080/api/services", service, headers);
      alert("Service added");
      setService({ phoneNumber: "", name: "", serviceType: "" });
    } catch (error) {
      alert("Failed to add service");
    }
  };

  const handleAddPayment = async () => {
    try {
      await axios.post("http://localhost:8080/api/payments", { ...payment, amount: parseFloat(payment.amount) }, headers);
      alert("Payment recorded");
      setPayment({ name: "", phoneNumber: "", category: "", serviceType: "", amount: "" });
    } catch (error) {
      alert("Failed to record payment");
    }
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4 text-center">Receptionist Panel - VisTrack</h2>

      <ul className="nav nav-tabs mb-3">
        {["register", "checkin", "service", "payment"].map(tab => (
          <li className="nav-item" key={tab}>
            <button
              className={`nav-link ${activeSection === tab ? 'active' : ''}`}
              onClick={() => setActiveSection(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          </li>
        ))}
      </ul>

      {activeSection === 'register' && (
        <div className="card p-3">
          <h5>Register Visitor</h5>
          <input className="form-control mb-2" placeholder="Name" value={newVisitor.name} onChange={e => setNewVisitor({ ...newVisitor, name: e.target.value })} />
          <input className="form-control mb-2" placeholder="Phone Number" value={newVisitor.phoneNumber} onChange={e => setNewVisitor({ ...newVisitor, phoneNumber: e.target.value })} />
          <input className="form-control mb-2" placeholder="Address" value={newVisitor.address} onChange={e => setNewVisitor({ ...newVisitor, address: e.target.value })} />
          <button className="btn btn-dark" onClick={handleRegisterVisitor}>Register</button>
        </div>
      )}

      {activeSection === 'checkin' && (
        <div className="card p-3">
          <h5>Check-In/Out</h5>
          <input className="form-control mb-2" placeholder="Phone Number" value={checkInPhone} onChange={e => setCheckInPhone(e.target.value)} />
          <div className="d-flex gap-2">
            <button className="btn btn-success" onClick={handleCheckIn}>Check In</button>
            <button className="btn btn-danger" onClick={handleCheckOut}>Check Out</button>
          </div>
        </div>
      )}

      {activeSection === 'service' && (
        <div className="card p-3">
          <h5>Add Service</h5>
          <input className="form-control mb-2" placeholder="Phone Number" value={service.phoneNumber} onChange={e => setService({ ...service, phoneNumber: e.target.value })} />
          <input className="form-control mb-2" placeholder="Service Name" value={service.name} onChange={e => setService({ ...service, name: e.target.value })} />
          <input className="form-control mb-2" placeholder="Service Type" value={service.serviceType} onChange={e => setService({ ...service, serviceType: e.target.value })} />
          <button className="btn btn-primary" onClick={handleAddService}>Add Service</button>
        </div>
      )}

      {activeSection === 'payment' && (
        <div className="card p-3">
          <h5>Add Payment</h5>
          <input className="form-control mb-2" placeholder="Name" value={payment.name} onChange={e => setPayment({ ...payment, name: e.target.value })} />
          <input className="form-control mb-2" placeholder="Phone Number" value={payment.phoneNumber} onChange={e => setPayment({ ...payment, phoneNumber: e.target.value })} />
          <input className="form-control mb-2" placeholder="Category" value={payment.category} onChange={e => setPayment({ ...payment, category: e.target.value })} />
          <input className="form-control mb-2" placeholder="Service Type" value={payment.serviceType} onChange={e => setPayment({ ...payment, serviceType: e.target.value })} />
          <input className="form-control mb-2" type="number" placeholder="Amount" value={payment.amount} onChange={e => setPayment({ ...payment, amount: e.target.value })} />
          <button className="btn btn-warning" onClick={handleAddPayment}>Record Payment</button>
        </div>
      )}
    </div>
  );
}
