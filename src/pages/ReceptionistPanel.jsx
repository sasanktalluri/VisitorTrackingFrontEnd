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
  const [receiptFile, setReceiptFile] = useState(null);
  const [extractedPayments, setExtractedPayments] = useState([]);
  const [errors, setErrors] = useState({});

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

  const validateNumberField = (value, fieldName) => {
    if (isNaN(value) || value.trim() === "") {
      setErrors(prev => ({ ...prev, [fieldName]: "Must be a number" }));
      return false;
    } else {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[fieldName];
        return updated;
      });
      return true;
    }
  };

  const handleRegisterVisitor = async () => {
    if (!validateNumberField(newVisitor.phoneNumber, "registerPhone")) return;
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
    if (!validateNumberField(checkInPhone, "checkinPhone")) return;
    try {
      await axios.post("http://localhost:8080/api/visits/checkin", { phoneNumber: checkInPhone }, headers);
      alert("Checked in");
    } catch (error) {
      alert("Check-in failed");
    }
  };

  const handleCheckOut = async () => {
    if (!validateNumberField(checkInPhone, "checkinPhone")) return;
    try {
      await axios.post(`http://localhost:8080/api/visits/checkout/${checkInPhone}`, {}, headers);
      alert("Checked out");
    } catch (error) {
      alert("Checkout failed");
    }
  };

  const handleAddService = async () => {
    if (!validateNumberField(service.phoneNumber, "servicePhone")) return;
    try {
      await axios.post("http://localhost:8080/api/services", service, headers);
      alert("Service added");
      setService({ phoneNumber: "", name: "", serviceType: "" });
    } catch (error) {
      alert("Failed to add service");
    }
  };

  const handleAddPayment = async () => {
    if (!validateNumberField(payment.phoneNumber, "paymentPhone") || !validateNumberField(payment.amount, "paymentAmount")) return;
    try {
      await axios.post("http://localhost:8080/api/payments", { ...payment, amount: parseFloat(payment.amount) }, headers);
      alert("Payment recorded");
      setPayment({ name: "", phoneNumber: "", category: "", serviceType: "", amount: "" });
    } catch (error) {
      alert("Failed to record payment");
    }
  };

  const handleReceiptUpload = async () => {
    if (!receiptFile) return;
    const formData = new FormData();
    formData.append("file", receiptFile);
    try {
      const res = await axios.post("http://localhost:8080/api/ocr/extract-payments", formData, headers);
      setExtractedPayments(res.data);
    } catch (error) {
      alert("Failed to extract payments");
    }
  };

  const handleExtractedChange = (index, field, value) => {
    const updated = [...extractedPayments];
    updated[index][field] = value;
    setExtractedPayments(updated);
  };

  const handleDeleteExtractedPayment = (index) => {
    const updated = [...extractedPayments];
    updated.splice(index, 1);
    setExtractedPayments(updated);
  };
  const isValidPayment = (payment) => {
    const isPhoneValid = /^\d+$/.test(payment.phoneNumber?.trim() || "");
    const isAmountValid = !isNaN(payment.amount) && parseFloat(payment.amount) > 0;
    return isPhoneValid && isAmountValid;
  };
  const handlePushAll = async () => {
    const newExtracted = [...extractedPayments];
    const promises = [];
  
    for (let i = 0; i < newExtracted.length; i++) {
      if (isValidPayment(newExtracted[i])) {
        const payload = newExtracted[i];
        promises.push(
          axios.post("http://localhost:8080/api/payments", payload, headers)
            .then(() => i)
            .catch(() => null)
        );
      }
    }
  
    const results = await Promise.all(promises);
    const indexesToDelete = results.filter(idx => idx !== null).sort((a, b) => b - a); // descending
    for (const idx of indexesToDelete) {
      newExtracted.splice(idx, 1);
    }
  
    setExtractedPayments(newExtracted);
    alert("Bulk push complete. Valid payments submitted.");
  };
    
  
  const handlePushExtractedPayment = async (index) => {
    const pay = extractedPayments[index];
    const isPhoneValid = !isNaN(pay.phoneNumber);
    const isAmountValid = !isNaN(pay.amount);

    if (!isPhoneValid || !isAmountValid) {
      alert("Phone number and amount must be valid numbers");
      return;
    }

    try {
      const res = await axios.post("http://localhost:8080/api/payments", pay, headers);
      if (res.status === 200) {
        const updated = [...extractedPayments];
        updated.splice(index, 1);
        setExtractedPayments(updated);
      } else {
        alert("Failed to push payment");
      }
    } catch (error) {
      alert("Error pushing payment");
    }
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4 text-center">Receptionist Panel - VisTrack</h2>

      <ul className="nav nav-tabs mb-3">
        {["register", "checkin", "service", "payment", "receipt"].map(tab => (
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
          {errors.registerPhone && <div className="text-danger">{errors.registerPhone}</div>}
          <input className="form-control mb-2" placeholder="Address" value={newVisitor.address} onChange={e => setNewVisitor({ ...newVisitor, address: e.target.value })} />
          <button className="btn btn-dark" onClick={handleRegisterVisitor}>Register</button>
        </div>
      )}

      {activeSection === 'checkin' && (
        <div className="card p-3">
          <h5>Check-In/Out</h5>
          <input className="form-control mb-2" placeholder="Phone Number" value={checkInPhone} onChange={e => setCheckInPhone(e.target.value)} />
          {errors.checkinPhone && <div className="text-danger">{errors.checkinPhone}</div>}
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
          {errors.servicePhone && <div className="text-danger">{errors.servicePhone}</div>}
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
          {errors.paymentPhone && <div className="text-danger">{errors.paymentPhone}</div>}
          <input className="form-control mb-2" placeholder="Category" value={payment.category} onChange={e => setPayment({ ...payment, category: e.target.value })} />
          <input className="form-control mb-2" placeholder="Service Type" value={payment.serviceType} onChange={e => setPayment({ ...payment, serviceType: e.target.value })} />
          <input className="form-control mb-2" type="number" placeholder="Amount" value={payment.amount} onChange={e => setPayment({ ...payment, amount: e.target.value })} />
          {errors.paymentAmount && <div className="text-danger">{errors.paymentAmount}</div>}
          <button className="btn btn-warning" onClick={handleAddPayment}>Record Payment</button>
        </div>
      )}

      {activeSection === 'receipt' && (
        <div className="card p-3">
          <h5>Upload Payment Receipt</h5>
          <input type="file" className="form-control mb-2" accept="image/*" onChange={e => setReceiptFile(e.target.files[0])} />
          <button className="btn btn-secondary mb-3" onClick={handleReceiptUpload}>Extract Payments</button>
          {extractedPayments.length > 0 && (
            <table className="table table-bordered text-center align-middle">
            <thead>
              <tr>
                <th style={{ width: "10%" }}>Name</th>
                <th style={{ width: "10%" }}>Phone</th>
                <th style={{ width: "15%" }}>Category</th>
                <th style={{ width: "15%" }}>Service Type</th>
                <th style={{ width: "10%" }}>Amount</th>
                <th style={{ width: "15%" }}>Date</th>
                <th style={{ width: "15%" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {extractedPayments.map((pay, idx) => (
                <tr key={idx}>
                  <td style={{ width: "10%" }}>
                    <input className="form-control form-control-sm" value={pay.name || ""} onChange={e => handleExtractedChange(idx, "visitorName", e.target.value)} />
                  </td>
                  <td style={{ width: "10%" }}>
                    <input className="form-control form-control-sm" value={pay.phoneNumber || ""} onChange={e => handleExtractedChange(idx, "phoneNumber", e.target.value)} />
                  </td>
                  <td style={{ width: "15%" }}>
                    <input className="form-control form-control-sm" value={pay.category || ""} onChange={e => handleExtractedChange(idx, "category", e.target.value)} />
                  </td>
                  <td style={{ width: "15%" }}>
                    <input className="form-control form-control-sm" value={pay.serviceType || ""} onChange={e => handleExtractedChange(idx, "serviceType", e.target.value)} />
                  </td>
                  <td style={{ width: "10%" }}>
                    <input type="number" className="form-control form-control-sm" value={pay.amount || ""} onChange={e => handleExtractedChange(idx, "amount", e.target.value)} />
                  </td>
                  <td style={{ width: "15%" }}>
                    <input className="form-control form-control-sm" value={pay.timestamp || ""} onChange={e => handleExtractedChange(idx, "timestamp", e.target.value)} />
                  </td>
                  <td style={{ width: "15%" }} >
                    <button className="btn btn-success btn-sm px-2 py-1" onClick={() => handlePushExtractedPayment(idx)} disabled={!isValidPayment(pay)}>Push</button>
                    <button className="btn btn-danger btn-sm px-2 py-1" onClick={() => handleDeleteExtractedPayment(idx)}>Del</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
            
          )}
          <button className="btn btn-success mb-2" onClick={handlePushAll} disabled={!extractedPayments.some(isValidPayment)}>
            Push All Valid Payments
            </button>

        </div>
      )}
    </div>
  );
}
