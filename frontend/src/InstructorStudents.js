import React, { useEffect, useState } from 'react';
import axios from 'axios';
import LogoutButton from './LogoutButton';
import Notifications from './Notifications';
import './InstructorStudents.css';
import Swal from 'sweetalert2';
import {useNavigate} from 'react-router-dom'
import { FaHome, FaGraduationCap, FaChartLine, FaBook, FaBell, FaSearch } from 'react-icons/fa';

function InstructorStudents() {
  const [isHovered, setIsHovered] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
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

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentSYear = currentDate.getFullYear();

  const getCurrentSchoolYear = () => {
    if (currentMonth >= 7) {
      return `${currentSYear}-${currentSYear + 1}`;
    } else {
      return `${currentSYear - 1}-${currentSYear}`;
    }
  };

  const [selectedYear, setSelectedYear] = useState(getCurrentSchoolYear);
  const [selectedSem, setSelectedSem] = useState("All");

  const handleYearFilter = (e) => {
    setSelectedYear(e.target.value);
  };

  const handleSemFilter = (e) => {
    setSelectedSem(e.target.value);
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

  useEffect(() => {
    axios.get('http://localhost/cams/backend/getStudents.php', { withCredentials: true })
        .then(res => {
          setStudents(res.data);
        })
        .catch(err => {console.error('Error fetching students:', err);});
  }, []);

  return (
    <div>
      {/* Navigation Bar */}
    <div className="sidebar" onMouseEnter={() => setIsHovered(true)}
    onMouseLeave={() => setIsHovered(false)}>
    <h5 className="logo">CAMS</h5>
    <nav className="nav">
        <div className="icon" onClick={() => navigate('/instructorDashboard')}>
            <FaHome title="Home" />
            {isHovered && <span className="ms-3">Home</span>}
        </div>
        <div className="icon" onClick={() => navigate('/instructorCourses')}>
            <FaBook title="Courses" />
            {isHovered && <span className="ms-3">Courses</span>}
        </div>
        <div className="icon icon-active" onClick={() => navigate('/instructorStudents')}>
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
        <h5>Student List</h5>
        <div className="top-right-header">
          <span className="admin-role">
            {user ? `${user.user_firstname} ${user.user_lastname}` : 'Instructor'}
          </span>
          <Notifications />
        </div>
      </div>
      <div className="divider"></div>
      <div className="top-bar">
        <div className="search-wrapper-students">
          <FaSearch className="search-icon"/>
          <input type="text" placeholder="Search" className="search-box"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select className="role-filter-students" value={selectedSem} onChange={handleSemFilter}>
          <option value="All">All Semesters</option>
          <option value="1st Year 1st Sem">1st Year 1st Sem</option>
          <option value="1st Year 2nd Sem">1st Year 2nd Sem</option>
          <option value="2nd Year 1st Sem">2nd Year 1st Sem</option>
          <option value="2nd Year 2nd Sem">2nd Year 2nd Sem</option>
          <option value="3rd Year 1st Sem">3rd Year 1st Sem</option>
          <option value="3rd Year 2nd Sem">3rd Year 2nd Sem</option>
          <option value="4th Year 1st Sem">4th Year 1st Sem</option>
          <option value="4th Year 2nd Sem">4th Year 2nd Sem</option>
        </select>
        <select className="role-filter-students" value={selectedYear} onChange={handleYearFilter}>
          <option value="All">All Years</option>
            {schoolYears.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
        </select>
      </div>
      <table className="log-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Semester</th>
            <th>Course and Section</th>
            <th>Attendance Rates</th>
          </tr>
        </thead>
        <tbody>
          {students.length > 0 ? students
          .filter(student => {
            const nameOrIdMatches = student?.user_firstname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student?.user_middlename?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student?.user_lastname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student?.user_id?.toString().includes(searchQuery) ||
            student?.course_name?.toLowerCase().includes(searchQuery.toLowerCase())

            const yearMatches = selectedYear === "All" || student.section_year === selectedYear;

            const semMatches = selectedSem === "All" || student.section_semester === selectedSem;

            return nameOrIdMatches && yearMatches && semMatches;
          })
          .map(student => (
              <tr key={`${student.user_id}-${student.courseassign_id}`}>
                  <td>{student.user_id}</td>
                  <td>{student.user_firstname} {student.user_middlename} {student.user_lastname}</td>
                  <td>S.Y. {student.section_year} - {student.section_semester}</td>
                  <td>{student.course_name} - {student.section_name}</td>
                  <td style={{textAlign: 'center'}}>{student.attendance_rate}%</td>
              </tr>
          )) : (<tr>
                  <td colSpan="6" className="no-records">No records found.</td>
                </tr>)}
        </tbody>
      </table>
    </div>
  </div>
  );
};

export default InstructorStudents;