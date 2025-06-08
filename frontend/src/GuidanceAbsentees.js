import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './GuidanceAbsentees.css';
import Swal from 'sweetalert2';
import {useNavigate} from 'react-router-dom'
import {FaPen, FaTrash, FaSearch, FaSignOutAlt} from 'react-icons/fa';

function GuidanceAbsentees() {
  const [user, setUser] = useState(null);
  const [absentees, setAbsentees] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState("All");
  const navigate = useNavigate();

  const handleLogout = () => {
      axios.get('http://localhost/cams/backend/logout.php', {
      withCredentials: true
      })
      .then(res => {
      console.log(res.data.message);
      navigate('/login');
      })
      .catch(err => {
      console.error("Logout failed", err);
      });
  };

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
      if (user?.user_role) {
        if (user?.user_role !== 'Guidance') {
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
              navigate('/instructorDashboard');
            }
          });
        }
      }
    }, [user?.user_role, navigate]);
    
    useEffect(() => {
      axios.get('http://localhost/cams/backend/getAbsentees.php', { withCredentials: true })
        .then(res => {
          setAbsentees(res.data);
        })
        .catch(err => console.error('Error loading absentees:', err));
    }, []);

    const handleYearFilter = (e) => {
      setSelectedYear(e.target.value);
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

    const callStudent = (userId, studentName) => {
      Swal.fire({
        title: 'Call Student?',
        text: `Are you sure you want to call ${studentName}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, Call',
        cancelButtonText: 'Cancel'
      }).then((result) => {
        if (result.isConfirmed) {
          axios.post('http://localhost/cams/backend/sendNotification.php', {
            user_id: userId,
            notif_type: 'Absentee Call',
            notif_message: `You have been called to the Guidance Office.`
          }, { withCredentials: true })
          .then((res) => {
            Swal.fire('Success!', res.data.success, 'success')
            .then(() => window.location.reload());
          })
          .catch((err) => {
            Swal.fire('Error', 'Failed to send notification', 'error');
            console.error(err);
          });
        }
      });
    };

  return (
    <div>
      <div className="content">
        <div className="header-row">
          <h5>Absentee Students</h5>
          <div className="top-right-header">
            <span className="admin-role">
              {user ? `${user.user_firstname} ${user.user_lastname}` : 'Administrator'}
            </span>
            <FaSignOutAlt className="bell-icon" title="Logout" onClick={handleLogout} />
          </div>
        </div>
        <div className="divider"></div>
        <div className="top-bar">
          <div className="search-wrapper-absents">
            <FaSearch className="search-icon"/>
            <input type="text" placeholder="Search" className="search-box"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select className="role-filter-absents" value={selectedYear} onChange={handleYearFilter}>
            <option value="All">All Years</option>
              {schoolYears.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
          </select>
          <button className="add-section" onClick={() => navigate('/guidanceCalledStudents')}>
              View Called Students
          </button>
        </div>

        <table className="section-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Semester</th>
              <th>Section</th>
              <th>Total Absents</th>
              <th>Attendance Rate</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {absentees.length > 0 ? absentees
              .filter(student => {
              const matchesSearch = student.student_name.toLowerCase().includes(searchQuery.toLowerCase());
              const yearMatch = selectedYear === 'All' || student.schoolYear === selectedYear;
              return matchesSearch && yearMatch;
              })
              .map(student => (
              <tr key={student.student_id}>
                  <td>{student.student_id}</td>
                  <td>{student.student_name}</td>
                  <td>S.Y. {student.schoolYear}-{student.semester}</td>
                  <td>{student.section_name}</td>
                  <td>{student.total_absent}</td>
                  <td>{student.attendance_rate}%</td>
                  <td>
                    <button className="call-student" onClick={() => callStudent(student.student_id, student.student_name)}>
                        Call
                    </button>
                  </td>
              </tr>
              )) : (
              <tr>
                  <td colSpan="7">No students to show.</td>
              </tr>
              )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GuidanceAbsentees;