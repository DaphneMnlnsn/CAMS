import React, { useState, useEffect } from 'react';
import './AddCourse.css';

function EditCourse({ onClose, onSave, courseData }) {
  const [formData, setFormData] = useState({
    courseName: '',
    courseCode: '',
    courseYear: '',
    courseTerm: '',
    courseDesc: ''
  });

  useEffect(() => {
      if (courseData) {  
        setFormData({
          idNumber: courseData.course_id,
          courseName: courseData.course_name,
          courseCode: courseData.course_code,
          courseYear: courseData.course_year,
          courseTerm: courseData.course_term,
          courseDesc: courseData.course_desc
        });
      }
    }, [courseData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
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
  const schoolYears = generateSchoolYears(currentYear, 10);

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <h5>Edit Course</h5>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <label>Course Name</label>
          <input name="courseName" onChange={handleChange} value={formData.courseName} placeholder="Course Name" />
          
          <div className="name-group">
            <div>
              <label>Course Code</label>
              <input name="courseCode" onChange={handleChange} value={formData.courseCode} placeholder="Code" />
            </div>
            <div>
                <label>Year</label>
                <select name="courseYear" value={formData.courseYear} onChange={handleChange}>
                  <option value="">Select Year</option>
                  {schoolYears.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
            </div>
            <div>
                <label>Term</label>
                <select name="courseTerm" onChange={handleChange} value={formData.courseTerm}>
                    <option value="1">1st Term</option>
                    <option value="2">2nd Term</option>
                </select>
            </div>
          </div>

          <label>Course Description</label>
          <textarea className="description-textarea" name="courseDesc" onChange={handleChange} value={formData.courseDesc} placeholder="Course Description" />
        </div>
        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button className="save-btn" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}

export default EditCourse;