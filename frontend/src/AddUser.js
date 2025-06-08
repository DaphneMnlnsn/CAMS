import React, { useState } from 'react';
import './AddUser.css';
import Swal from 'sweetalert2';

function AddUser({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    idNumber: '',
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    birthdate: '',
    role: 'Instructor',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    if (!formData.idNumber.trim()) return 'ID Number is required';
    if (!formData.firstName.trim()) return 'First Name is required';
    if (!formData.lastName.trim()) return 'Last Name is required';
    if (!formData.email.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Invalid email format';
    if (!formData.birthdate) return 'Birthdate is required';
    return null;
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost/cams/backend/getUsers.php');
      if (!response.ok) throw new Error('Failed to fetch users');
      const users = await response.json();
      return users;
    } catch (error) {
      Swal.fire('Error', 'Unable to check for existing users', 'error');
      return null;
    }
  };

  const handleSave = async () => {
    const errorMessage = validate();
    if (errorMessage) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: errorMessage,
      });
      return;
    }
    const users = await fetchUsers();
    if (!users) return;
    
    const duplicateId = users.some(user => parseInt(user.user_id) === parseInt(formData.idNumber));
    if (duplicateId) {
      Swal.fire('Validation Error', 'A user with this ID number already exists', 'error');
      return;
    }

    const duplicateEmail = users.some(user => user.user_email.toLowerCase() === formData.email.toLowerCase());
    if (duplicateEmail) {
      Swal.fire('Validation Error', 'A user with this email already exists', 'error');
      return;
    }
    onSave(formData);
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <h5>Add User</h5>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <label>ID Number</label>
          <input name="idNumber" onChange={handleChange} value={formData.idNumber} placeholder="ID Number" />
          
          <div className="name-group">
            <div>
              <label>First Name</label>
              <input name="firstName" onChange={handleChange} value={formData.firstName} placeholder="First Name" />
            </div>
            <div>
              <label>Middle Name</label>
              <input name="middleName" onChange={handleChange} value={formData.middleName} placeholder="Middle Name" />
            </div>
          </div>

          <label>Last Name</label>
          <input name="lastName" onChange={handleChange} value={formData.lastName} placeholder="Last Name" />
          
          <label>Email</label>
          <input name="email" onChange={handleChange} value={formData.email} placeholder="Email" />

          <div className="name-group">
            <div>
              <label>Birthdate</label>
              <input name="birthdate" type="date" onChange={handleChange} value={formData.birthdate} />
            </div>
            <div>
              <label>User Role</label>
              <select name="role" onChange={handleChange} value={formData.role}>
                <option value="Administrator">Administrator</option>
                <option value="Student">Student</option>
                <option value="Instructor">Instructor</option>
                <option value="Guidance">Guidance</option>
              </select>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button className="save-btn" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}

export default AddUser;