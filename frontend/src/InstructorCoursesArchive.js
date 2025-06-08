import React, { useEffect, useState } from 'react';
import axios from 'axios';
import LogoutButton from './LogoutButton';
import Notifications from './Notifications';
import './InstructorCourses.css';
import Swal from 'sweetalert2';
import {useNavigate} from 'react-router-dom'
import { FaHome, FaGraduationCap, FaChartLine, FaBook, FaBell, FaSearch, FaRedo, FaTrash } from 'react-icons/fa';

function InstructorCoursesArchive() {
  const [isHovered, setIsHovered] = useState(false);
  const [user, setUser] = useState(null);
  const [courseAssignments, setAssignedCourses] = useState([]);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(""); 
  const [selectedYear, setSelectedYear] = useState("All");
  const [selectedTerm, setSelectedTerm] = useState("All");
  const [selectedCourse, setSelectedCourse] = useState(null);

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

    useEffect(() => {
      axios.get('http://localhost/cams/backend/getAssignedCoursesArchive.php', { withCredentials: true })
        .then(res => setAssignedCourses(res.data))
        .catch(err => console.error('Error fetching courses:', err));
    }, []);

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

    const handleYearFilter = (e) => {
      setSelectedYear(e.target.value);
    };

    const handleTermFilter = (e) => {
      setSelectedTerm(e.target.value);
    };

    const handleCourseAction = (id, action) => {
      Swal.fire({
        title: `Are you sure?`,
        text: `Do you really want to ${action} this handled course?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: `Yes, ${action} it!`
      }).then((result) => {
        if (result.isConfirmed) {
          axios.post('http://localhost/cams/backend/handledCourseAction.php',
            { id, action },
            {
              headers: { 'Content-Type': 'application/json' },
              withCredentials: true
            }
          )
          .then(res => {
            if (res.data.success) {
              Swal.fire('Success', `Handled course ${action}d successfully`, 'success')
                .then(() => window.location.reload());
            } else {
              Swal.fire('Error', res.data.error || 'Action failed', 'error');
            }
          })
          .catch(err => {
            console.error(`Error performing ${action}:`, err);
            Swal.fire('Error', `Error while performing ${action}`, 'error');
          });
        }
      });
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
        <h5>Archived Handled Course List</h5>
        <div className="top-right-header">
          <span className="admin-role">
            {user ? `${user.user_firstname} ${user.user_lastname}` : 'Instructor'}
          </span>
          <Notifications />
        </div>
      </div>
      <div className="divider"></div>
      <div className="top-bar">
        <div className="search-wrapper-coursesArc">
          <FaSearch className="search-icon"/>
          <input type="text" placeholder="Search" className="search-box"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select className="role-filter"
          value={selectedYear}
          onChange={handleYearFilter}
        >
          <option value="All">All Years</option>
          {schoolYears.map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
        <select className="role-filter"
          value={selectedTerm}
          onChange={handleTermFilter}
        >
          <option value="All">All Terms</option>
          <option value="1">1st Term</option>
          <option value="2">2nd Term</option>
        </select>
        <button className="view-archive" onClick={() => navigate('/instructorCourses')}>View Handled Courses</button>
      </div>
      <div className="card-container">
        {courseAssignments.length > 0 ? courseAssignments
          .filter(course_assignment => {
            const nameOrCodeMatches = course_assignment.course_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course_assignment.course_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course_assignment.course_year?.includes(searchQuery)

            const yearMatches = selectedYear === "All" || course_assignment.course_year === selectedYear;

            const semMatches = selectedTerm === "All" || course_assignment.course_term === selectedTerm;

            return nameOrCodeMatches && yearMatches && semMatches;
          })
          .map(course_assignment => (
            <div key={course_assignment.courseassign_id} className="course-card">
              <div className="card-header">
                <h6 className="course-name">{course_assignment.course_name}</h6>
                <p className="course-title">{course_assignment.course_code} - S.Y. {course_assignment.course_year}-{course_assignment.course_term}T</p>
              </div>
              <div className="card-body">
                <h6 className="course-section">{course_assignment.section_name}</h6>
                <p className="course-description">{course_assignment.course_desc}...</p>
                <div className="card-actions">
                <button className="icon-btn edit-icon"
                onClick={() => {
                  handleCourseAction(course_assignment.courseassign_id, 'restore')
                }}>
                    <FaRedo />
                  </button>
                  <button className="edit-btn" onClick={() => navigate(`/instructorCourseDetails/${course_assignment.courseassign_id}`)}>
                    View More
                  </button>
                  <button className="icon-btn delete-icon" onClick={() => handleCourseAction(course_assignment.courseassign_id, 'delete')}>
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
        )) : (<p className="no-records">No records found.</p>)}
      </div>
    </div>
  </div>
  );
};

export default InstructorCoursesArchive;