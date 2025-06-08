import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './InstructorCourseDetails.css';
import LogoutButton from './LogoutButton';
import Notifications from './Notifications';
import './InstructorCourseDetails.css';
import Swal from 'sweetalert2';
import {useNavigate} from 'react-router-dom'
import { FaHome, FaGraduationCap, FaChartLine, FaBook, FaBell, FaSearch, FaPen, FaTrash } from 'react-icons/fa';
import AddStudentsToCourse from './AddStudentsToCourse';

function InstructorCourseDetails() {
  const [isHovered, setIsHovered] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const { courseassign_id } = useParams();
  const [courseDetails, setCourseDetails] = useState({});
  const [attendanceList, setAttendanceList] = useState([]);
  const [activeTab, setActiveTab] = useState('today');
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [students, setStudents] = useState([]);

  useEffect(() => {
      axios.get('http://localhost/cams/backend/checkSession.php', {
        withCredentials: true
      })
      .then(res => {
        if (res.data.loggedIn) {
          setUser(res.data);
        } else {
          navigate('/login');
        }
      })
      .catch(err => {
        console.error(err);
      });
    }, []);

    useEffect(() => {
      fetch('http://localhost/cams/backend/cleanExpired.php', {
        method: 'GET',
        credentials: 'include',
      })
        .then(res => res.json())
        .then(data => {
          console.log('QR cleanup result:', data);
        })
        .catch(err => {
          console.error('QR cleanup error:', err);
        });
    }, []);

    useEffect(() => {
      if (user?.user_role) {
        if (user?.user_role !== 'Instructor') {
          Swal.fire({
            icon: 'error',
            title: 'Access Denied',
            text: 'You do not have permission to access this page.',
            backdrop: `rgba(0, 0, 0, 1.0)`
          }).then(() => {
            if(user?.user_role === 'Administrator'){
              navigate('/adminDashboard');
            }
            else{
              navigate('/guidanceAbsentees');
            }
          });
        }
      }
    }, [user?.user_role, navigate]);

    useEffect(() => {
      if (!courseassign_id) return;

      axios.post('http://localhost/cams/backend/getCourseAttendance.php', {
        courseassign_id: courseassign_id
      }, { withCredentials: true })
      .then(res => {
        setCourseDetails(res.data.course);
        setAttendanceList(res.data.attendance);
        setStudents(res.data.students);
      })
      .catch(err => {
        console.error('Error fetching attendance:', err);
      });
    }, [courseassign_id]);


      const today = new Date().toISOString().slice(0, 10);
      const filteredAttendance = activeTab === 'today'
          ? attendanceList.filter(a => a.session_date?.slice(0, 10) === today)
          : attendanceList;

      const getStatusIcon = (status) => {
          if (status === 'Present') return <span className="status-icon present">✔</span>;
          if (status === 'Late') return <span className="status-icon late">⏰</span>;
          return <span className="status-icon absent">✖</span>;
      };

      const allDates = Array.from(
        new Set(attendanceList.map(a => a.session_date.slice(0, 10)))
      ).sort();

      const attendanceMap = attendanceList.reduce((map, a) => {
        const d = a.session_date.slice(0,10);
        if (!map[a.student_id]) map[a.student_id] = {};
        map[a.student_id][d] = a;
        return map;
      }, {});

      const handleCourseAction = (studentId, handledID) => {
      Swal.fire({
        title: `Are you sure?`,
        text: `Do you really want to remove this student from the course?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: `Yes, remove it!`
      }).then((result) => {
        if (result.isConfirmed) {
          axios.post('http://localhost/cams/backend/assignStudentsToCourse.php',
            {
              action: 'delete',
              handledID: handledID,
              students: [studentId]
            },
            {
              headers: { 'Content-Type': 'application/json' },
              withCredentials: true
            }
          )
          .then(res => {
              Swal.fire('Success', 'Student removed from course successfully', 'success')
                .then(() => window.location.reload());
          })
          .catch(err => {
            console.error('Error while removing student:', err);
            Swal.fire('Error', 'Error while removing student', 'error');
          });
        }
      });
    };

    const handleStudentSave = (selectedStudents) => {
      console.log('Students saved:', selectedStudents);
      setShowStudentModal(false);
    };

    const handleShowCode = (codeID) => {
      Swal.fire({
        title: 'Enrollment Code',
        text: codeID
      });
    };

    const handleGenerateQR = async () => {
      try {
        const res = await axios.get('http://localhost/cams/backend/generateQRCode.php', {
          params: { courseassign_id },
          withCredentials: true
        });

        if (res.data.status === 'existing') {
          await Swal.fire({
            title: 'QR Already Exists',
            html: `
              <p><strong>Code:</strong> ${res.data.code}</p>
              <p><strong>Expires:</strong> ${new Date(res.data.expiration_time).toLocaleString()}</p>
              <img src="http://localhost/cams/backend/qr_images/${res.data.qr_image}" width="200" />
            `
          });
          return;
        }

        const { value: formValues } = await Swal.fire({
          title: 'Generate QR Code',
          html:
            '<label>Expiration Time</label>' +
            '<input id="exp" type="datetime-local" class="swal2-input">' +
            '<label>Late Time</label>' +
            '<input id="late" type="datetime-local" class="swal2-input">',
          focusConfirm: false,
          preConfirm: () => {
            const expiration_time = document.getElementById('exp').value;
            const late_time = document.getElementById('late').value;

            if (!expiration_time || !late_time) {
              Swal.showValidationMessage('Both fields are required.');
              return false;
            }

            const now = new Date();
            const expDate = new Date(expiration_time);
            const lateDate = new Date(late_time);

            if (expDate <= now) {
              Swal.showValidationMessage('Expiration time must be in the future.');
              return false;
            }
            if (lateDate >= expDate) {
              Swal.showValidationMessage('Late time must be before expiration time.');
              return false;
            }
            if (lateDate <= now) {
              Swal.showValidationMessage('Late time must be after present time.');
              return false;
            }

            return { expiration_time, late_time };
          }
        });

        if (formValues) {
          const generateRes = await axios.post('http://localhost/cams/backend/generateQRCode.php', {
            courseassign_id: courseassign_id,
            expiration_time: formValues.expiration_time,
            late_time: formValues.late_time
          },{
            withCredentials: true
          });

          Swal.fire({
            title: 'QR Code Generated!',
            html: `
              <p><strong>Unique Code:</strong> ${generateRes.data.code}</p>
              <img src="http://localhost/cams/backend/qr_images/${generateRes.data.qr_image}" width="200" />
            `
          });
        }
      } catch (err) {
        console.error(err);
        Swal.fire('Error', 'An error occurred while generating or checking the QR code.', 'error');
      }
    };

  return (
      <div>
      {/*Navigation Bar*/}
      <div className="sidebar" onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}>
      <h5 className="logo">CAMS</h5>
      <nav className="nav">
          <div className="icon" onClick={() => navigate('/instructorDashboard')}>
              <FaHome title="Home" />
              {isHovered && <span className="ms-3">Home</span>}
          </div>
          <div className="icon icon-active" onClick={() => navigate('/instructorCourses')}>
              <FaBook title="Courses" />
              {isHovered && <span className="ms-3">Courses</span>}
          </div>
          <div className="icon" onClick={() => navigate('/instructorStudents')}>
              <FaGraduationCap title="Students" />
              {isHovered && <span className="ms-3">Students</span>}
          </div>
          <div className="icon" onClick={() => navigate('/instructorReports')}>
              <FaChartLine title="Reports" />
              {isHovered && <span className="ms-3">Reports</span>}
          </div>
          <LogoutButton isHovered={isHovered} />
      </nav>
      </div>
      <div className="main-content">
      <div className="header-row">
        <h5>Course Details</h5>
        <div className="top-right-header">
          <span className="admin-role">
            {user ? `${user.user_firstname} ${user.user_lastname}` : 'Instructor'}
          </span>
          <Notifications />
        </div>
      </div>
      <div className="divider"></div>
      <div className="top-bar">
        <div className="course-header">
          <h2>{courseDetails.course_name}</h2>
          <p>{courseDetails.course_code}</p>
        </div>
        <div className="button-group">
          <button className="add-course" onClick={handleGenerateQR}>Generate QR Code</button>
          <button className="view-archive" onClick={() => handleShowCode(courseDetails.enrollment_code)}>Enrollment Code</button>
        </div>
      </div>
      <div className="tabs">
          <span
              className={activeTab === 'today' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('today')}
          >
          View Attendance Today
          </span>
          <span
          className={activeTab === 'full' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('full')}
          >
          View Full Attendance Grid
          </span>
      </div>

      {activeTab === 'today' ? (
        <table className="attendance-table">
            <thead>
            <tr>
                <th>ID</th>
                <th>Student Name</th>
                <th>Status</th>
                <th>Marked On</th>
            </tr>
            </thead>
            <tbody>
            {filteredAttendance.map((attendance) => (
                <tr key={attendance.student_id}>
                <td>{attendance.student_id}</td>
                <td>{attendance.student_name}</td>
                <td>{getStatusIcon(attendance.attendance_status)}</td>
                <td>{attendance.marked_on}</td>
                </tr>
            ))}
            {filteredAttendance.length === 0 && (
              <tr>
                <td colSpan="4">No attendance records to display.</td>
              </tr>
            )}
            </tbody>
        </table>
      ) : (
        <table className="attendance-grid">
          <thead>
            <tr>
              <th>ID</th>
              <th>Student Name</th>
              {allDates.map(d => (
                <th key={d}>{new Date(d).toLocaleDateString(undefined, { month:'short', day:'numeric' })}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s.student_id}>
                <td>{s.student_id}</td>
                <td>{s.student_name}</td>
                {allDates.map(d => {
                  const rec = attendanceMap[s.student_id]?.[d];
                  return (
                    <td key={d}>
                      {rec 
                        ? getStatusIcon(rec.attendance_status)
                        : <span className="status-icon absent">—</span>
                      }
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="students-header">
        <h4 className='section-title'>Enrolled Students</h4>
        <button className="add-student" onClick={() => setShowStudentModal(true)}>+ Add Students</button>
      </div>        
      <div className='table-container'>
        <table className='students-table'>
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Email</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {students.length > 0 ? students
              .map(student => (
                <tr key={student.student_id}>
                  <td>{student.student_id}</td>
                  <td>{student.student_name}</td>
                  <td>{student.student_email}</td>
                  <td className="trash-cell">
                    <button className="trash-button" onClick={() => handleCourseAction(student.student_id, courseassign_id)}>
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              )) : (<tr>
                      <td colSpan="3" className="no-records" style={{textAlign: 'center'}}>No records found.</td>
                    </tr>)}
            </tbody>
        </table>
      </div>
    </div>
    {showStudentModal && (
      <AddStudentsToCourse
        handledID={courseassign_id}
        onClose={() => setShowStudentModal(false)}
        onSave={handleStudentSave}
      />
    )}
  </div>
  );
};

export default InstructorCourseDetails;