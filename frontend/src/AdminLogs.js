import React, { useEffect, useState } from 'react';
import axios from 'axios';
import LogoutButton from './LogoutButton';
import './AdminLogs.css';
import Swal from 'sweetalert2';
import {useNavigate} from 'react-router-dom'
import { FaHome, FaUser, FaGraduationCap, FaChartLine, FaFileAlt, FaBook, FaBell, FaPen, FaTrash, FaSearch } from 'react-icons/fa';

function AdminLogs() {
    const [isHovered, setIsHovered] = useState(false);
    const [user, setUser] = useState(null);
    const [logs, setLogs] = useState([]);
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedActivity, setSelectedActivity] = useState("All");
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

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
      
      const fetchLogs = (startDate, endDate) => {
        const params = {};
        if (startDate && endDate) {
          params.startDate = startDate;
          params.endDate = endDate;
        }
      
        axios.get('http://localhost/cams/backend/getLogs.php', {
          withCredentials: true,
          params: params
        })
        .then(res => {
          if (Array.isArray(res.data)) {
            setLogs(res.data);
          } else {
            setLogs([]);
          }
        })
        .catch(err => {
          console.error('Error loading logs:', err);
          setLogs([]);
        });
      };      

      useEffect(() => {
        fetchLogs(startDate, endDate);
      }, [startDate, endDate]);

      const handleActivityFilter = (e) => {
        setSelectedActivity(e.target.value);
      };

      const downloadReport = (type) => {
        const params = new URLSearchParams();
        params.append("type", type);

        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);
        if (selectedActivity && selectedActivity !== "All") {
          params.append("activity", selectedActivity);
        }

        const url = `http://localhost/cams/backend/generateReport.php?${params.toString()}`;
        window.open(url, '_blank');
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
              <div className="icon" onClick={() => navigate('/adminSections')}>
                  <FaGraduationCap title="Sections" />
                  {isHovered && <span className="ms-3">Sections</span>}
              </div>
              <div className="icon" onClick={() => navigate('/adminReports')}>
                  <FaChartLine title="Reports" />
                  {isHovered && <span className="ms-3">Reports</span>}
              </div>
              <div className="icon icon-active" onClick={() => navigate('/adminLogs')}>
                  <FaFileAlt title="Audit Log" />
                  {isHovered && <span className="ms-3">Audit Log</span>}
              </div>
              <LogoutButton isHovered={isHovered} />
          </nav>
        </div>
        <div className="main-content">
          <div className="header-row">
            <h5>Audit Logs</h5>
            <div className="top-right-header">
              <span className="admin-role">
                {user ? `${user.user_firstname} ${user.user_lastname}` : 'Administrator'}
              </span>
            </div>
          </div>
          <div className="divider"></div>
          <div className="top-bar">
            <div className="search-wrapper-logs">
              <FaSearch className="search-icon"/>
              <input type="text" placeholder="Search" className="search-box"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select className="role-filter-actions"
              value={selectedActivity}
              onChange={handleActivityFilter}
            >
              <option value="All">All Actions</option>
              <option value="Log In">Log In</option>
              <option value="Add Course">Add Course</option>
              <option value="Add Handled Course">Add Handled Course</option>
              <option value="Add Section">Add Section</option>
              <option value="Add User">Add User</option>
              <option value="Assign Students">Assign Students</option>
              <option value="Remove Students">Remove Students</option>
              <option value="Generate QR">Generate QR</option>
              {/*<option value="Submit Attendance">Submit Attendance</option>
              <option value="Enroll to Course">Enroll to Course</option>
              <option value="Generate Report">Generate Report</option>*/}
            </select>
            <div className="date-range-filter">
              <label>From:</label>
              <input
                type="date"
                value={startDate}
                onChange={e => {
                  const value = e.target.value;
                  setStartDate(value);
                  if (endDate && value > endDate) {
                    setEndDate('');
                  }
                }}
                max={new Date().toISOString().split('T')[0]}
                className="date-filter"
              />
              <label>To:</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                min={startDate || undefined}
                disabled={!startDate}
                className="date-filter"
              />
              {(startDate || endDate) && (
                <button className="clear-date-btn" onClick={() => { setStartDate(''); setEndDate(''); }}>
                  Clear
                </button>
              )}
            </div>
            <button className="generate-report" onClick={() => downloadReport('log')}>Generate Report</button>
          </div>

          <table className="log-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Type</th>
                <th>Description</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.length > 0 ? logs
              .filter(log => {
                const matches = log?.user_firstname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log?.user_middlename?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log?.user_lastname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log?.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log?.timestamp?.includes(searchQuery);
                  
                const logMatches = selectedActivity === "All" || log.action_type === selectedActivity;

                return matches && logMatches;
              })
              .map(log => (
                <tr key={log.log_id}>
                  <td>{log.user_firstname + (log.user_middlename ? ` ${log.user_middlename}` : '') + " " + log.user_lastname}</td>
                  <td>{log.user_role}</td>
                  <td>{log.action_type}</td>
                  <td>{log.description}</td>
                  <td>{log.timestamp}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6">No logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
};

export default AdminLogs;