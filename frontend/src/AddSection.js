import React, { useState, useEffect } from 'react';
import './AddSection.css';
import Swal from 'sweetalert2';

function AddSection({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    sectionName: '',
    sectionSemester: '',
    sectionYear: '',
    sectionMajor: ''
  });

  const [existingSections, setExistingSections] = useState([]);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      const response = await fetch('http://localhost/cams/backend/getSections.php');
      if (!response.ok) throw new Error('Failed to fetch sections');
      const data = await response.json();
      setExistingSections(data);
    } catch (error) {
      Swal.fire('Error', 'Unable to fetch sections from server', 'error');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    if (!formData.sectionName.trim()) return 'Section Name is required';
    if (!formData.sectionSemester) return 'Section Semester is required';
    if (!formData.sectionYear) return 'Section Year is required';
    if (!formData.sectionMajor) return 'Major is required';

    const duplicate = existingSections.find(section =>
      section.section_name === formData.sectionName &&
      section.section_semester === formData.sectionSemester &&
      section.section_year === formData.sectionYear &&
      section.section_major === formData.sectionMajor
    );

    if (duplicate) return 'This section already exists';

    return null;
  };

  const handleSave = () => {
    const error = validate();
    if (error) {
      Swal.fire('Validation Error', error, 'error');
      return;
    }

    onSave(formData);
    onClose();
  };

  const generateSchoolYears = (startYear, numberOfYears) => {
    const years = [];
    for (let i = 0; i < numberOfYears; i++) {
      const year = startYear - i;
      years.push(`${year}-${year + 1}`);
    }
    return years;
  };

  const currentYear = new Date().getFullYear();
  const schoolYears = generateSchoolYears(currentYear, 5);

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <h5>Add Section</h5>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <label>Section Name</label>
          <input
            name="sectionName"
            onChange={handleChange}
            value={formData.sectionName}
            placeholder="Section Name"
          />

          <div className="name-group">
            <div>
              <label>Section Semester</label>
              <select name="sectionSemester" value={formData.sectionSemester} onChange={handleChange}>
                <option value="">Select Semester</option>
                <option value="1st Year 1st Sem">1st Year 1st Sem</option>
                <option value="1st Year 2nd Sem">1st Year 2nd Sem</option>
                <option value="2nd Year 1st Sem">2nd Year 1st Sem</option>
                <option value="2nd Year 2nd Sem">2nd Year 2nd Sem</option>
                <option value="3rd Year 1st Sem">3rd Year 1st Sem</option>
                <option value="3rd Year 2nd Sem">3rd Year 2nd Sem</option>
                <option value="4th Year 1st Sem">4th Year 1st Sem</option>
                <option value="4th Year 2nd Sem">4th Year 2nd Sem</option>
              </select>
            </div>
            <div>
              <label>Year</label>
              <select name="sectionYear" value={formData.sectionYear} onChange={handleChange}>
                <option value="">Select Year</option>
                {schoolYears.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          <label>Major</label>
          <select name="sectionMajor" value={formData.sectionMajor} onChange={handleChange}>
            <option value="">Select Major</option>
            <option value="Bachelor of Science in Information Technology">Bachelor of Science in Information Technology</option>
            <option value="Bachelor of Science in Computer Engineering">Bachelor of Science in Computer Engineering</option>
            <option value="Bachelor of Science in Computer Science">Bachelor of Science in Computer Science</option>
            <option value="Bachelor of Science in Hospitality Management">Bachelor of Science in Hospitality Management</option>
            <option value="Bachelor of Science in Tourism Management">Bachelor of Science in Tourism Management</option>
            <option value="Bachelor of Science in Business Management">Bachelor of Science in Business Management</option>
            <option value="Bachelor of Science in Psychology">Bachelor of Science in Psychology</option>
            <option value="Bachelor of Science in Accountancy">Bachelor of Science in Accountancy</option>
          </select>
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button className="save-btn" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}

export default AddSection;
