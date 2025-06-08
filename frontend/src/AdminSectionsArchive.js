import React, { useEffect, useState } from 'react';
import axios from 'axios';
import LogoutButton from './LogoutButton';
import './AdminSections.css';
import Swal from 'sweetalert2';
import {useNavigate} from 'react-router-dom'
import { FaHome, FaUser, FaGraduationCap, FaChartLine, FaFileAlt, FaBook, FaBell, FaRedo, FaPen, FaTrash, FaSearch } from 'react-icons/fa';

function AdminSectionsArchive() {
    const [isHovered, setIsHovered] = useState(false);
    const [user, setUser] = useState(null);
    const [sections, setSections] = useState([]);
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedRole, setSelectedRole] = useState("All");
    const [selectedSection, setSelectedSection] = useState(null);

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
        axios.get('http://localhost/cams/backend/getSectionsArchive.php', { withCredentials: true })
          .then(res => {
            setSections(res.data);
          })
          .catch(err => console.error('Error loading sections:', err));
      }, []);

      const handleRoleFilter = (e) => {
        setSelectedRole(e.target.value);
      };

      const handleSectionAction = (id, action) => {
        Swal.fire({
          title: `Are you sure?`,
          text: `Do you really want to ${action} this user?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: `Yes, ${action} it!`
        }).then((result) => {
          if (result.isConfirmed) {
            axios.post('http://localhost/cams/backend/sectionAction.php',
              { id, action },
              {
                headers: { 'Content-Type': 'application/json' },
                withCredentials: true
              }
            )
            .then(res => {
              if (res.data.success) {
                Swal.fire('Success', `Section ${action}d successfully`, 'success')
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
              <div className="icon" onClick={() => navigate('/adminCourses')}>
                  <FaBook title="Courses" />
                  {isHovered && <span className="ms-3">Courses</span>}
              </div>
              <div className="icon icon-active" onClick={() => navigate('/adminSections')}>
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
            <h5>Section List</h5>
            <div className="top-right-header">
              <span className="admin-role">
                {user ? `${user.user_firstname} ${user.user_lastname}` : 'Administrator'}
              </span>
            </div>
          </div>
          <div className="divider"></div>
          <div className="top-bar">
            <div className="search-wrapper-sections-archive">
              <FaSearch className="search-icon"/>
              <input type="text" placeholder="Search" className="search-box"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select className="role-filter-sections"
              value={selectedRole}
              onChange={handleRoleFilter}
            >
              <option value="All">All Majors</option>
              <option value="Bachelor of Science in Information Technology">Bachelor of Science in Information Technology</option>
              <option value="Bachelor of Science in Computer Engineering">Bachelor of Science in Computer Engineering</option>
              <option value="Bachelor of Science in Computer Science">Bachelor of Science in Computer Science</option>
            </select>
            <button className="view-archive" onClick={() => navigate('/adminSections')}>View Sections</button>
          </div>

          <table className="section-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Semester</th>
                <th>School Year</th>
                <th>Major</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sections.length > 0 ? sections
              .filter(section => {
                const matches = section?.section_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                section?.section_semester?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                section?.section_year?.includes(searchQuery);
                  
                const majorMatches = selectedRole === "All" || section.section_major === selectedRole;

                return matches && majorMatches;
              })
              .map(section => (
                <tr key={section.section_id}>
                  <td>{section.section_id}</td>
                  <td>{section.section_name}</td>
                  <td>{section.section_semester}</td>
                  <td>S.Y. {section.section_year}</td>
                  <td>{section.section_major}</td>
                  <td>
                      <button className="icon-btn edit-btn" onClick={() => handleSectionAction(section.section_id, 'restore')}>
                        <FaRedo />
                      </button>
                      <button className="icon-btn delete-btn"
                        onClick={() => handleSectionAction(section.section_id, 'delete')}>
                        <FaTrash />
                      </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6">No records</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
};

export default AdminSectionsArchive;