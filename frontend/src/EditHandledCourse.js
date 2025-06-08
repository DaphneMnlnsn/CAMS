import React, { useState, useEffect } from 'react';
import './AddHandled.css';

function EditHandledCourse({ onClose, onSave, courseData }) {
  const [formData, setFormData] = useState({
    courseTime: '',
    courseRoom: '',
    courseDays: []
  });

  useEffect(() => {
      if (courseData && courseData.section_schedule) {  
        const timeAndDays = courseData.section_schedule.split(' : ');
        const days = timeAndDays[0]?.split(',').map(day => day.trim()) || [];
        const time = timeAndDays[1]?.trim() || '';

        setFormData({
            idNumber: courseData.courseassign_id,
            courseTime: time,
            courseRoom: courseData.section_room,
            courseDays: days
        });
      }
    }, [courseData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    console.log(formData);
    onSave(formData);
    onClose();
  };
  
    const courseDaysList = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const handleDayChange = (day) => {
        setFormData((prev) => ({
        ...prev,
        courseDays: prev.courseDays.includes(day)
            ? prev.courseDays.filter((d) => d !== day)
            : [...prev.courseDays, day]
        }));
    };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <h5>Edit Handled Course</h5>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
        <div className="name-group">
            <div>
              <label>Course Time</label>
              <input name="courseTime" onChange={handleChange} value={formData.courseTime} placeholder="Time" />
            </div>
            <div>
                <label>Course Room</label>
                <input name="courseRoom" onChange={handleChange} value={formData.courseRoom} placeholder="Room" />
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
            </div>
        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button className="save-btn" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}

export default EditHandledCourse;