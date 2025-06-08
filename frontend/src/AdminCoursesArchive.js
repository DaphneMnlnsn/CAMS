import React, { useEffect, useState } from 'react';
import axios from 'axios';
import LogoutButton from './LogoutButton';
import './AdminCourses.css';
import Swal from 'sweetalert2';
import {useNavigate} from 'react-router-dom'
import { FaHome, FaUser, FaGraduationCap, FaChartLine, FaFileAlt, FaBook, FaBell, FaRedo, FaPen, FaTrash, FaSearch } from 'react-icons/fa';

function AdminCoursesArchive() {
    const [isHovered, setIsHovered] = useState(false);
    const [user, setUser] = useState(null);
    const [courses, setCourses] = useState([]);
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");

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
          if (user?.user_role !== 'Administrator') {
            Swal.fire({
              icon: 'error',
              title: 'Access Denied',
              text: 'You do not have permission to access this page.',
              backdrop: `rgba(0, 0, 0, 1.0)`
            }).then(() => {
              if(user?.user_role === 'Instructor'){
                navigate('/instructorDashboard');
              }
              else{
                navigate('/guidanceAbsentees');
              }
            });
          }
        }
      }, [user?.user_role, navigate]);
      
      useEffect(() => {
        axios.get('http://localhost/cams/backend/getCoursesArchive.php', { withCredentials: true })
          .then(res => setCourses(res.data))
          .catch(err => console.error('Error fetching courses:', err));
      }, []);

      const handleCourseAction = (id, action) => {
        Swal.fire({
          title: `Are you sure?`,
          text: `Do you really want to ${action} this course?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: `Yes, ${action} it!`
        }).then((result) => {
          if (result.isConfirmed) {
            axios.post('http://localhost/cams/backend/courseAction.php',
              { id, action },
              {
                headers: { 'Content-Type': 'application/json' },
                withCredentials: true
              }
            )
            .then(res => {
              if (res.data.success) {
                Swal.fire('Success', `Course ${action}d successfully`, 'success')
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
        {/* Navigation Bar */}
        <div className="sidebar" onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}>
          <h5 className="logo">CAMS</h5>
          <nav className="nav">
              <div className="icon" onClick={() => navigate('/adminDashboard')}>
                  <FaHome title="Home" />
                  {isHovered && <span className="ms-3">Home</span>}
              </div>
              <div className="icon" onClick={() => navigate('/adminUsers')}>
                  <FaUser title="Users" />
                  {isHovered && <span className="ms-3">Users</span>}
              </div>
              <div className="icon icon-active" onClick={() => navigate('/adminCourses')}>
                  <FaBook title="Courses" />
                  {isHovered && <span className="ms-3">Courses</span>}
              </div>
              <div className="icon" onClick={() => navigate('/adminSections')}>
                  <FaGraduationCap title="Sections" />
                  {isHovered && <span className="ms-3">Sections</span>}
              </div>
              <div className="icon" onClick={() => navigate('/adminReports')}>
                  <FaChartLine title="Reports" />
                  {isHovered && <span className="ms-3">Reports</span>}
              </div>
              <div className="icon" onClick={() => navigate('/adminLogs')}>
                  <FaFileAlt title="Activity Log" />
                  {isHovered && <span className="ms-3">Activity Log</span>}
              </div>
              <LogoutButton isHovered={isHovered} />
          </nav>
        </div>
        <div className="main-content">
          <div className="header-row">
            <h5>Course Archive</h5>
            <div className="top-right-header">
              <span className="admin-role">
                {user ? `${user.user_firstname} ${user.user_lastname}` : 'Administrator'}
              </span>
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
            <button className="view-courses" onClick={() => navigate('/adminCourses')}>View Courses</button>
          </div>
          <div className="card-container">
            {(() => {
                const filteredCourses = courses.filter(course =>
                course.course_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                course.course_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                course.course_year.includes(searchQuery)
                );

                if (filteredCourses.length < 1) {
                return <p className="no-records">No records found.</p>;
                }

                return filteredCourses.map(course => (
                <div key={course.course_id} className="course-card">
                    <div className="card-header">
                    <h6 className="course-name">{course.course_name}</h6>
                    <p className="course-title">
                        {course.course_code} - SY{course.course_year}-{course.course_term}T
                    </p>
                    </div>
                    <div className="card-body">
                    <p className="course-description">{course.course_desc}...</p>
                    <div className="card-actions">
                        <button className="edit-btn" onClick={() => handleCourseAction(course.course_id, 'restore')}>
                        Restore
                        </button>
                        <button className="delete-btn" onClick={() => handleCourseAction(course.course_id, 'delete')}>
                        Delete
                        </button>
                    </div>
                    </div>
                </div>
                ));
            })()}
            </div>
        </div>
      </div>
    );
};

export default AdminCoursesArchive;