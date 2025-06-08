import React, { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import './ImportUsers.css';

const ImportUsers = ({ onClose, onImportSuccess }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleImport = () => {
    if (!file) {
      Swal.fire('No File Selected', 'Please choose a CSV file before importing.', 'warning');
      return;
    }

    const formData = new FormData();
    formData.append('csv_file', file);

    setIsUploading(true);
    axios.post('http://localhost/cams/backend/importUsers.php', formData, {
      withCredentials: true
    })
    .then(res => {
      setIsUploading(false);
      if (res.data.success) {
        Swal.fire('Import Complete', res.data.success, 'success').then(() => {
          onImportSuccess();
          onClose();
        });
      } else {
        const msg = res.data.errors
          ? res.data.errors.join('<br/>')
          : (res.data.error || 'Unknown import error');
        Swal.fire({ icon: 'error', title: 'Import Failed', html: msg });
      }
    })
    .catch(err => {
        setIsUploading(false);
        console.error('Import Error:', err);
        if (err.response && err.response.data) {
            const payload = err.response.data;
            if (payload.errors) {
            Swal.fire({
                icon: 'error',
                title: 'Import Failed',
                html: Array.isArray(payload.errors)
                ? payload.errors.join('<br/>')
                : JSON.stringify(payload.errors)
            });
            return;
            }
            if (payload.error) {
            Swal.fire('Error', payload.error, 'error');
            return;
            }
        }
        Swal.fire('Error', 'Server error while importing CSV.', 'error');
    });
  };

  return (
    <div className="import-users-modal-backdrop">
      <div className="import-users-modal">
        <h3>Import Users via CSV</h3>
        <p>
          Upload a CSV where each row has these columns in order:
          <br/>
          <strong>idNumber, firstName, middleName (optional), lastName, email, birthdate (YYYY-MM-DD), role</strong>
          <br/>
          Example row:
        </p>
        <code>202100123,John,Michael,Doe,john.doe@example.com,2002-05-15,Student</code>
        <div className="file-input-wrapper">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
          />
        </div>
        <div className="button-row">
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isUploading}
          >Cancel</button>
          <button
            className="btn btn-primary-users"
            onClick={handleImport}
            disabled={isUploading}
          >
            {isUploading ? 'Importing…' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportUsers;
