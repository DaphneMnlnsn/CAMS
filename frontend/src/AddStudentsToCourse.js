import React, { useEffect, useState } from 'react';
import './AddStudentsToCourse.css';
import axios from 'axios';
import Swal from 'sweetalert2';

function AddStudentsToCourse({ handledID, onClose }) {

    const [students, setStudents] = useState([]);
    const [selected, setSelected] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        axios.get(`http://localhost/cams/backend/getUsers.php?courseassign_id=${handledID}`, { withCredentials: true })
        .then(res => {
        const unassignedStudents = res.data.filter(
        user => user.user_role === 'Student' && 
        user.archived !== 1 &&
        !user.courseassign_id);
        setStudents(unassignedStudents);
        })
        .catch(err => console.error('Error loading students:', err));
    }, []);

    const toggleStudent = (id) => {
        setSelected((prev) =>
        prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const handleSave = () => {
        axios.post('http://localhost/cams/backend/assignStudentsToCourse.php', {
            action: 'assign',
            handledID,
            students: selected
        }, { withCredentials: true })
        .then(() => {
            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'The course/student(s) have been added successfully.'
            }).then(() => {
                window.location.reload();
                onClose();
            });
        })
        .catch(err => {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'There was an error. Please try again.'
            });
            console.error('Assignment failed:', err);
        });
    };

    return (
    <div className="modal-backdrop">
        <div className="modal">
            <div className="modal-header">
                <h5>Add Students to Section</h5>
            </div>
            <div className="modal-body">
                <div className="student-filter">
                    <input type="text" placeholder="Search" value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}/>
                </div>
                <ul className="student-list">
                    {students
                    .filter(student => {
                    const nameOrIdMatches = student.student_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    student.user_firstname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    student.user_middlename?.includes(searchQuery.toLowerCase()) ||
                    student.user_lastname?.includes(searchQuery.toLowerCase());

                    return nameOrIdMatches;
                    }).map(student => (
                    <li key={student.user_id}>
                    <label>
                    <input
                        type="checkbox"
                        checked={selected.includes(student.user_id)}
                        onChange={() => toggleStudent(student.user_id)}
                    />
                    <span>{student.user_id} - {student.user_firstname} {student.user_middlename} {student.user_lastname}</span>
                    </label>
                    </li>
                    ))}
                </ul>
            </div>
            <div className="modal-footer">
                <button className="save-btn" onClick={handleSave}>Save</button>
            </div>
        </div>
    </div>
    );
}

export default AddStudentsToCourse;
