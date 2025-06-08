import React, { useState, useEffect } from 'react';
import './AddCourse.css';
import Swal from 'sweetalert2';

function AddCourse({ onClose, onSave }) {
  const [formData, setFormData] = useState({
  courseName: '',
  courseCode: '',
  courseYear: '',
  courseTerm: '1st Term',
  courseDesc: ''
  });

  const [existingCourses, setExistingCourses] = useState([]);

  const fetchCourses = async () => {
    try {
      const response = await fetch('http://localhost/cams/backend/getCourses.php');
      if (!response.ok) throw new Error('Failed to fetch courses');
      const courses = await response.json();
      return courses;
    } catch (error) {
      Swal.fire('Error', 'Unable to fetch courses', 'error');
      return null;
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const validate = () => {
    if (!formData.courseName.trim()) return 'Course Name is required';
    if (!formData.courseCode.trim()) return 'Course Code is required';
    if (!formData.courseYear) return 'Please select a Year';
    if (!formData.courseTerm) return 'Please select a Term';

    return null;
  };

  const handleSave = async () => {
    const courses = await fetchCourses();
    if (!courses) {
      Swal.fire('Error', 'Could not fetch courses', 'error');
      return;
    }
    setExistingCourses(courses);

    const errorMessage = validate();
    if (errorMessage) {
      Swal.fire('Validation Error', errorMessage, 'error');
      return;
    }

    const duplicate = courses.find(course =>
    course.course_name?.trim().toLowerCase() === formData.courseName.trim().toLowerCase() &&
    course.course_code?.trim().toLowerCase() === formData.courseCode.trim().toLowerCase() &&
    course.course_year === formData.courseYear &&
    course.course_term === formData.courseTerm
    );

    if (duplicate) {
      Swal.fire('Validation Error', 'This course already exists', 'error');
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
          <h5>Add Course</h5>
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

export default AddCourse;