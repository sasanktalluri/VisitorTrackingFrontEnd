import React, { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

export default function ReceptionistPanel() {
  const [visitors, setVisitors] = useState([]);
  const [newVisitor, setNewVisitor] = useState({ name: "", phoneNumber: "", address: "", role: "Customer" });
  const [checkInPhone, setCheckInPhone] = useState("");
  const [activeSection, setActiveSection] = useState("register");
  const [service, setService] = useState({ phoneNumber: "", name: "", serviceType: "" });
  const [payment, setPayment] = useState({ name: "", phoneNumber: "", category: "", serviceType: "", amount: "" });

  // Single-image upload
  const [receiptFile, setReceiptFile] = useState(null);
  const [singleBusy, setSingleBusy] = useState(false);

  // Multi-image upload
  const [bulkReceiptFiles, setBulkReceiptFiles] = useState([]);
  const [bulkBusy, setBulkBusy] = useState(false);

  const [extractedPayments, setExtractedPayments] = useState([]);
  const [errors, setErrors] = useState({});

  const headers = { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } };

  useEffect(() => { fetchVisitors(); }, []);

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
      setErrors(prev => { const u = { ...prev }; delete u[fieldName]; return u; });
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
    } catch {
      alert("Registration failed");
    }
  };

  const handleCheckIn = async () => {
    if (!validateNumberField(checkInPhone, "checkinPhone")) return;
    try {
      await axios.post("http://localhost:8080/api/visits/checkin", { phoneNumber: checkInPhone }, headers);
      alert("Checked in");
    } catch {
      alert("Check-in failed");
    }
  };

  const handleCheckOut = async () => {
    if (!validateNumberField(checkInPhone, "checkinPhone")) return;
    try {
      await axios.post(`http://localhost:8080/api/visits/checkout/${checkInPhone}`, {}, headers);
      alert("Checked out");
    } catch {
      alert("Checkout failed");
    }
  };

  const handleAddService = async () => {
    if (!validateNumberField(service.phoneNumber, "servicePhone")) return;
    try {
      await axios.post("http://localhost:8080/api/services", service, headers);
      alert("Service added");
      setService({ phoneNumber: "", name: "", serviceType: "" });
    } catch {
      alert("Failed to add service");
    }
  };

  const handleAddPayment = async () => {
    if (!validateNumberField(payment.phoneNumber, "paymentPhone") || !validateNumberField(payment.amount, "paymentAmount")) return;
    try {
      await axios.post("http://localhost:8080/api/payments", { ...payment, amount: parseFloat(payment.amount) }, headers);
      alert("Payment recorded");
      setPayment({ name: "", phoneNumber: "", category: "", serviceType: "", amount: "" });
    } catch {
      alert("Failed to record payment");
    }
  };

  // --- OCR helpers (single + bulk) ---
  const OCR_ENDPOINTS = [
    "http://localhost:8080/api/ocrss/extract-payment",   // new controller path
    "http://localhost:8080/api/ocr/extract-payments"     // legacy path
  ];

  const callOcrForFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    let lastErr;
    for (const url of OCR_ENDPOINTS) {
      try {
        const res = await axios.post(url, formData, headers);
        return Array.isArray(res.data) ? res.data : [];
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr || new Error("OCR failed");
  };

  const handleReceiptUpload = async () => {
    if (!receiptFile || singleBusy) return;
    setSingleBusy(true);
    try {
      const list = await callOcrForFile(receiptFile);
      setExtractedPayments(prev => [...prev, ...list]);
    } catch {
      alert("Failed to extract payments");
    } finally {
      setSingleBusy(false);
    }
  };

  const handleBulkReceiptUpload = async () => {
    if (!bulkReceiptFiles || bulkReceiptFiles.length === 0 || bulkBusy) return;
    setBulkBusy(true);
    try {
      const tasks = Array.from(bulkReceiptFiles).map(f => callOcrForFile(f).catch(() => []));
      const all = await Promise.all(tasks);
      const merged = all.flat();
      if (merged.length === 0) alert("No payments extracted from the selected screenshots.");
      setExtractedPayments(prev => [...prev, ...merged]);
    } finally {
      setBulkBusy(false);
    }
  };

  // --- extracted payments table helpers ---
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

  const isValidPayment = (p) => {
    const isPhoneValid = /^\d+$/.test((p.phoneNumber || "").trim());
    const isAmountValid = !isNaN(p.amount) && parseFloat(p.amount) > 0;
    return isPhoneValid && isAmountValid;
  };

  const handlePushAll = async () => {
    const newExtracted = [...extractedPayments];
    const promises = [];
    for (let i = 0; i < newExtracted.length; i++) {
      if (isValidPayment(newExtracted[i])) {
        const payload = { ...newExtracted[i], amount: parseFloat(newExtracted[i].amount) };
        promises.push(
          axios.post("http://localhost:8080/api/payments", payload, headers)
            .then(() => i)
            .catch(() => null)
        );
      }
    }
    
    const results = await Promise.all(promises);
    const toDelete = results.filter(i => i !== null).sort((a, b) => b - a);
    for (const idx of toDelete) newExtracted.splice(idx, 1);
    setExtractedPayments(newExtracted);
    alert("Bulk push complete. Valid payments submitted.");
  };
  const handlePushAllSS = async () => {
    const newExtracted = [...extractedPayments];
    const promises = [];
    for (let i = 0; i < newExtracted.length; i++) {
      if (isValidPayment(newExtracted[i])) {
        const payload = { ...newExtracted[i], amount: parseFloat(newExtracted[i].amount) };
        promises.push(
          axios.post("http://localhost:8080/api/payments", payload, headers)
            .then(() => i)
            .catch(() => null)
        );
      }
    }
    
    const results = await Promise.all(promises);
    const toDelete = results.filter(i => i !== null).sort((a, b) => b - a);
    for (const idx of toDelete) newExtracted.splice(idx, 1);
    setExtractedPayments(newExtracted);
    alert("Bulk push complete. Valid payments submitted.");
  };
  const handlePushExtractedPayment = async (index) => {
    const pay = extractedPayments[index];
    if (!isValidPayment(pay)) {
      alert("Phone number must be digits and amount > 0");
      return;
    }
    try {
      const res = await axios.post("http://localhost:8080/api/payments", { ...pay, amount: parseFloat(pay.amount) }, headers);
      if (res.status === 200) {
        const updated = [...extractedPayments];
        updated.splice(index, 1);
        setExtractedPayments(updated);
      } else {
        alert("Failed to push payment");
      }
    } catch {
      alert("Error pushing payment");
    }
  };
  const handlePushExtractedPaymentSS = async (index) => {
    const pay = extractedPayments[index];
   
    try {
      const res = await axios.post("http://localhost:8080/api/payments", { ...pay, amount: parseFloat(pay.amount) }, headers);
      if (res.status === 200) {
        const updated = [...extractedPayments];
        updated.splice(index, 1);
        setExtractedPayments(updated);
      } else {
        alert("Failed to push payment");
      }
    } catch {
      alert("Error pushing payment");
    }
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4 text-center">Receptionist Panel - VisTrack</h2>

      <ul className="nav nav-tabs mb-3">
        {["register", "checkin", "service", "payment", "receipt", "process payment screenshot"].map(tab => (
          <li className="nav-item" key={tab}>
            <button
              className={`nav-link ${activeSection === tab ? "active" : ""}`}
              onClick={() => setActiveSection(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          </li>
        ))}
      </ul>

      {activeSection === "register" && (
        <div className="card p-3">
          <h5>Register Visitor</h5>
          <input className="form-control mb-2" placeholder="Name" value={newVisitor.name} onChange={e => setNewVisitor({ ...newVisitor, name: e.target.value })} />
          <input className="form-control mb-2" placeholder="Phone Number" value={newVisitor.phoneNumber} onChange={e => setNewVisitor({ ...newVisitor, phoneNumber: e.target.value })} />
          {errors.registerPhone && <div className="text-danger">{errors.registerPhone}</div>}
          <input className="form-control mb-2" placeholder="Address" value={newVisitor.address} onChange={e => setNewVisitor({ ...newVisitor, address: e.target.value })} />
          <button className="btn btn-dark" onClick={handleRegisterVisitor}>Register</button>
        </div>
      )}

      {activeSection === "checkin" && (
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

      {activeSection === "service" && (
        <div className="card p-3">
          <h5>Add Service</h5>
          <input className="form-control mb-2" placeholder="Phone Number" value={service.phoneNumber} onChange={e => setService({ ...service, phoneNumber: e.target.value })} />
          {errors.servicePhone && <div className="text-danger">{errors.servicePhone}</div>}
          <input className="form-control mb-2" placeholder="Service Name" value={service.name} onChange={e => setService({ ...service, name: e.target.value })} />
          <input className="form-control mb-2" placeholder="Service Type" value={service.serviceType} onChange={e => setService({ ...service, serviceType: e.target.value })} />
          <button className="btn btn-primary" onClick={handleAddService}>Add Service</button>
        </div>
      )}

      {activeSection === "payment" && (
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

      {activeSection === "receipt" && (
        <div className="card p-3">
          <h5>Upload Payment Receipt</h5>
          <input
            type="file"
            className="form-control mb-2"
            accept="image/*,application/pdf"
            disabled={singleBusy}
            onChange={e => setReceiptFile(e.target.files[0])}
          />
          <button
            className="btn btn-secondary mb-3"
            onClick={handleReceiptUpload}
            disabled={singleBusy || !receiptFile}
          >
            {singleBusy && <span className="spinner-border spinner-border-sm me-2" role="status" />}
            {singleBusy ? "Extracting..." : "Extract Payments"}
          </button>

          {extractedPayments.length > 0 && (
            <>
              <PaymentsTable
                rows={extractedPayments}
                onChange={handleExtractedChange}
                onPush={handlePushExtractedPayment}
                onDelete={handleDeleteExtractedPayment}
                isValid={isValidPayment}
              />
              <button className="btn btn-success mb-2" onClick={handlePushAll} disabled={!extractedPayments.some(isValidPayment)}>
                Push All Valid Payments
              </button>
            </>
          )}
        </div>
      )}

      {activeSection === "process payment screenshot" && (
        <div className="card p-3">
          <h5>Upload Payment Screenshots </h5>
          <input
            type="file"
            className="form-control mb-2"
            accept="image/*,application/pdf"
            multiple
            disabled={bulkBusy}
            onChange={e => setBulkReceiptFiles(e.target.files)}
          />
          <div className="mb-2">
            {bulkReceiptFiles?.length ? `${bulkReceiptFiles.length} file(s) selected` : "No files selected"}
          </div>
          <button
            className="btn btn-secondary mb-4"
            onClick={handleBulkReceiptUpload}
            disabled={bulkBusy || !bulkReceiptFiles || bulkReceiptFiles.length === 0}
          >
            {bulkBusy && <span className="spinner-border spinner-border-sm me-2" role="status" />}
            {bulkBusy ? "Processing..." : "Extract from Multiple Screenshots"}
          </button>

          {extractedPayments.length > 0 && (
            <>
              <PaymentsTable
                rows={extractedPayments}
                onChange={handleExtractedChange}
                onPush={handlePushExtractedPaymentSS}
                onDelete={handleDeleteExtractedPayment}
                isValid={isValidPayment}
              />
              <button className="btn btn-success mb-2" onClick={handlePushAll} >
                Push All Valid Payments
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function PaymentsTable({ rows, onChange, onPush, onDelete, isValid }) {
  return (
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
        {rows.map((pay, idx) => (
          <tr key={idx}>
            <td><input className="form-control form-control-sm" value={pay.name || ""} onChange={e => onChange(idx, "name", e.target.value)} /></td>
            <td><input className="form-control form-control-sm" value={pay.phoneNumber || ""} onChange={e => onChange(idx, "phoneNumber", e.target.value)} /></td>
            <td><input className="form-control form-control-sm" value={pay.category || ""} onChange={e => onChange(idx, "category", e.target.value)} /></td>
            <td><input className="form-control form-control-sm" value={pay.serviceType || ""} onChange={e => onChange(idx, "serviceType", e.target.value)} /></td>
            <td><input type="number" className="form-control form-control-sm" value={pay.amount || ""} onChange={e => onChange(idx, "amount", e.target.value)} /></td>
            <td><input className="form-control form-control-sm" value={pay.timestamp || ""} onChange={e => onChange(idx, "timestamp", e.target.value)} /></td>
            <td>
              <button className="btn btn-success btn-sm px-2 py-1" onClick={() => onPush(idx)} disabled={!isValid(pay)}>Push</button>
              <button className="btn btn-danger btn-sm px-2 py-1 ms-1" onClick={() => onDelete(idx)}>Del</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
