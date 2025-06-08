import React, { useEffect, useState } from 'react';
import './AddUser.css';

function EditUser({ onClose, onSave, userData }) {
  const [formData, setFormData] = useState({
    idNumber: '',
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    birthdate: '',
    role: '',
  });

  useEffect(() => {
    if (userData) {
        const formattedBirthdate = userData.user_birthdate
        ? new Date(userData.user_birthdate).toISOString().split('T')[0]
        : '';

      setFormData({
        idNumber: userData.user_id,
        firstName: userData.user_firstname,
        middleName: userData.user_middlename || '',
        lastName: userData.user_lastname,
        email: userData.user_email,
        birthdate: formattedBirthdate,
        role: userData.user_role
      });
    }
  }, [userData]);

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <h5>Edit User</h5>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <label>ID Number</label>
          <input name="idNumber" value={formData.idNumber} disabled />
          
          <div className="name-group">
            <div>
              <label>First Name</label>
              <input name="firstName" onChange={handleChange} value={formData.firstName}/>
            </div>
            <div>
              <label>Middle Name</label>
              <input name="middleName" onChange={handleChange} value={formData.middleName}/>
            </div>
          </div>

          <label>Last Name</label>
          <input name="lastName" onChange={handleChange} value={formData.lastName}/>
          
          <label>Email</label>
          <input name="email" onChange={handleChange} value={formData.email}/>

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
          <button className="save-btn" onClick={handleSubmit}>Save</button>
        </div>
      </div>
    </div>
  );
}

export default EditUser;