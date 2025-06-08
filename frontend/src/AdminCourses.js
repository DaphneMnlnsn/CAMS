import React, { useEffect, useState } from 'react';
import axios from 'axios';
import LogoutButton from './LogoutButton';
import './AdminCourses.css';
import AddCourse from './AddCourse';
import EditCourse from './EditCourse';
import Swal from 'sweetalert2';
import {useNavigate} from 'react-router-dom'
import { FaHome, FaUser, FaGraduationCap, FaChartLine, FaFileAlt, FaBook, FaBell, FaRedo, FaPen, FaTrash, FaSearch } from 'react-icons/fa';

function AdminCourses() {
  const [isHovered, setIsHovered] = useState(false);
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
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

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentSYear = currentDate.getFullYear();

    const getCurrentTerm = () => {
      if (currentMonth >= 7 && currentMonth <= 12) {
        return "1";
      } else if (currentMonth >= 1 || currentMonth <= 6) {
        return "2";
      } else {
        return "1";
      }
    };

    const getCurrentSchoolYear = () => {
      if (currentMonth >= 7) {
        return `${currentSYear}-${currentSYear + 1}`;
      } else {
        return `${currentSYear - 1}-${currentSYear}`;
      }
    };

    const [selectedYear, setSelectedYear] = useState(getCurrentSchoolYear);
    const [selectedTerm, setSelectedTerm] = useState(getCurrentTerm);
    
    useEffect(() => {
      axios.get('http://localhost/cams/backend/getCourses.php', { withCredentials: true })
      .then(res => setCourses(res.data))
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

    const handleAddCourse = (newCourse) => {
      axios.post('http://localhost/cams/backend/addCourse.php', newCourse, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true })
      .then((res) => {
        setCourses([...courses, newCourse]);
        Swal.fire({
          icon: 'success',
          title: 'Course Added',
          text: 'The course has been added successfully.',
        }).then(() => {
          window.location.reload();
        });
      })
      .catch((err) => {
        console.error('Error adding course:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'There was an error adding the course. Please try again.',
        });
      });
    }

    const handleEditCourse = (updatedCourse) => {
      axios.post('http://localhost/cams/backend/editCourse.php', updatedCourse, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true
      })
      .then(res => {
        if (res.data.success) {
          Swal.fire('Success', 'Course updated successfully', 'success').then(() => {
            window.location.reload();
          });
        } else {
          Swal.fire('Error', res.data.error || 'Update failed', 'error');
        }
      })
      .catch(err => {
        console.error('Error editing course:', err);
        Swal.fire('Error', 'Something went wrong while updating.', 'error');
      });
    };

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
          <h5>Course List</h5>
          <div className="top-right-header">
            <span className="admin-role">
              {user ? `${user.user_firstname} ${user.user_lastname}` : 'Administrator'}
            </span>
          </div>
        </div>
        <div className="divider"></div>
        <div className="top-bar">
          <div className="search-wrapper-courses">
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
          <button className="add-course" onClick={() => setShowAddModal(true)}>+ Add New Course</button>
          <button className="view-archive" onClick={() => navigate('/adminCoursesArchive')}>View Archive</button>
        </div>
        <div className="card-container">
          {courses.length > 0 ? courses
            .filter(course => {
              const nameOrCodeMatches = course.course_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              course.course_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              course.course_year?.includes(searchQuery)

              const yearMatches = selectedYear === "All" || course.course_year === selectedYear;

              const semMatches = selectedTerm === "All" || course.course_term === selectedTerm;

              return nameOrCodeMatches && yearMatches && semMatches;
            })
            .map(course => (
              <div key={course.course_id} className="course-card">
                <div className="card-header">
                  <h6 className="course-name">{course.course_name}</h6>
                  <p className="course-title">{course.course_code} - S.Y. {course.course_year}-{course.course_term}T</p>
                </div>
                <div className="card-body">
                  <p className="course-description">{course.course_desc}...</p>
                  <div className="card-actions">
                    <button className="edit-btn"
                    onClick={() => {
                      setSelectedCourse(course);
                      setShowEditModal(true);
                    }}>
                      Edit
                    </button>
                    <button className="delete-btn" onClick={() => handleCourseAction(course.course_id, 'archive')}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
          )) : (<p className="no-records">No records found.</p>)}
        </div>
      </div>
      {showAddModal && (
        <AddCourse
          onClose={() => setShowAddModal(false)}
          onSave={handleAddCourse}
        />
      )}
      
      {showEditModal && selectedCourse && (
        <EditCourse
          courseData={selectedCourse}
          onClose={() => {
            setShowEditModal(false);
            setSelectedCourse(null);
          }}
          onSave={handleEditCourse}
        />
      )}
    </div>
  );
};

export default AdminCourses;