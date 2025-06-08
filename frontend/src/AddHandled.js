import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './AddHandled.css';
import Swal from 'sweetalert2';
import AddStudentsToCourse from './AddStudentsToCourse';

function AddHandled({ onClose, onHandledCreated }) {
  const [formData, setFormData] = useState({
    courseID: '',
    courseTime: '',
    courseRoom: '',
    courseDays: [],
    courseSection: '',
    selectedCourseYear: '',
    selectedCourseTerm: ''
  });

  const [showStudentModal, setShowStudentModal] = useState(false);
  const [newHandledID, setNewHandledID] = useState(null);

  const [courseList, setCourseList] = useState([]);
  useEffect(() => {
    axios.get('http://localhost/cams/backend/getCourses.php', { withCredentials: true })
    .then(res => setCourseList(res.data))
    .catch(err => console.error('Error fetching courses:', err));
  }, []);

  const [sectionList, setSectionList] = useState([]);
  useEffect(() => {
    axios.get('http://localhost/cams/backend/getSections.php', { withCredentials: true })
    .then(res => setSectionList(res.data))
    .catch(err => console.error('Error fetching sections:', err));
  }, []);

  const [handledList, setHandledList] = useState([]);
  useEffect(() => {
    axios.get('http://localhost/cams/backend/getAssignedCourses.php', { withCredentials: true })
    .then(res => setHandledList(res.data))
    .catch(err => console.error('Error fetching handled list:', err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'courseID') {
      const selectedCourse = courseList.find(c => String(c.course_id) === value);
      setFormData(prev => ({
        ...prev,
        courseID: value,
        selectedCourseYear: selectedCourse?.course_year,
        selectedCourseTerm: selectedCourse?.course_term
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleDayChange = (day) => {
    setFormData((prev) => ({
      ...prev,
      courseDays: prev.courseDays.includes(day)
      ? prev.courseDays.filter((d) => d !== day)
      : [...prev.courseDays, day]
    }));
  };

  const handleSave = async () => {
    if (!formData.courseID ||
        !formData.courseTime.trim() ||
        !formData.courseDays.length ||
        !formData.courseSection
    ) {
      return Swal.fire('Validation Error', 'All fields are required', 'error');
    }

    const dup = handledList.find(assign =>
      String(assign.course_id)   === String(formData.courseID)   &&
      String(assign.section_id)  === String(formData.courseSection)
    );
    console.log('Existing handled:', handledList, 'dup:', dup);
    if (dup) {
      return Swal.fire(
        'Validation Error',
        'You have already handled that course for this section.',
        'error'
      );
    }

    try {
      const res = await axios.post(
        'http://localhost/cams/backend/addHandledCourse.php',
        formData,
        { withCredentials: true }
      );
      const newID = res.data.courseassign_id;
      onHandledCreated(newID);
    } catch (err) {
      console.error('Error saving handled course:', err);
      Swal.fire('Error', 'Could not save handled course', 'error');
    }
  };
  
  const currentYear = new Date().getFullYear();
  const courseDaysList = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <h5>Select Course</h5>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div>
            <label>Course Name</label>
            <select name="courseID" value={formData.courseID} onChange={handleChange}>
              <option value="">-- Select Course --</option>
              {courseList.map(course => (
                <option key={course.course_id} value={course.course_id}>
                {course.course_name} - S.Y. {course.course_year}-{course.course_term}T
                </option>
              ))}
            </select>
          </div>
          <div className="name-group">
            <div>
              <label>Course Time</label>
              <input name="courseTime" onChange={handleChange} value={formData.courseCode} placeholder="Time" />
            </div>
            <div>
                <label>Course Room</label>
                <input name="courseRoom" onChange={handleChange} value={formData.courseCode} placeholder="Room" />
            </div>
          </div>
          <div>
            <label>Course Day</label>
            <div className="checkbox-group">
              {courseDaysList.map((day) => (
                <label key={day} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={formData.courseDays.includes(day)}
                    onChange={() => handleDayChange(day)}
                  />
                  <span>{day}</span>
                </label>
              ))}
            </div>
          </div>
          <label>Course Section</label>
          <select name="courseSection" value={formData.courseSection} onChange={handleChange} disabled={!formData.courseID}>
            <option value="">-- Select Section --</option>
            {sectionList
              .filter(section =>
                String(section.section_year) === String(formData.selectedCourseYear) &&
                String(section.section_semester).substring(9,10) === String(formData.selectedCourseTerm)
              )
              .map(section => (
                <option key={section.section_id} value={section.section_id}>
                  {section.section_name} - S.Y. {section.section_year}-{section.section_semester}
                </option>
              ))
            }
          </select>
        </div>
        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button className="save-btn" onClick={handleSave}>Save</button>
        </div>
      </div>
      {showStudentModal && (
        <AddStudentsToCourse
          handledID={newHandledID}
          onClose={() => setShowStudentModal(false)}
        />
      )}
    </div>
  );
}

export default AddHandled;