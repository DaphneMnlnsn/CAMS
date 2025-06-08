import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import LogoutButton from './LogoutButton';
import Notifications from './Notifications';
import './InstructorDashboard.css';
import Swal from 'sweetalert2';
import {useNavigate} from 'react-router-dom'
import { FaHome, FaGraduationCap, FaChartLine, FaBook, FaBell, FaRegClock, FaUsers, FaCheckCircle, FaTimesCircle, FaClock, FaChevronDown, FaRegCircle } from 'react-icons/fa';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

function InstructorDashboard() {
  const [isHovered, setIsHovered] = useState(false);
  const [user, setUser] = useState(null); 
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [schedule, setSchedule] = useState([]);
  const [lowAttendance, setLowAttendance] = useState([]);
  const [selectedDay, setSelectedDay] = useState('Today');

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
        fetch("http://localhost/cams/backend/instructorDashboard.php", {
          method: "GET",
          credentials: "include"
        })
          .then(res => res.json())
          .then(data => {
            setStats(data.stats || {});
            setSchedule(data.schedule || []);
            setLowAttendance(data.lowAttendance || []);
          })
          .catch(err => console.error(err));
      }, []);

  return (
    <div>
      {/*Navigation Bar*/}
      <div className="sidebar" onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}>
      <h5 className="logo">CAMS</h5>
      <nav className="nav">
          <div className="icon icon-active" onClick={() => navigate('/instructorDashboard')}>
              <FaHome title="Home" />
              {isHovered && <span className="ms-3">Home</span>}
          </div>
          <div className="icon" onClick={() => navigate('/instructorCourses')}>
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
          <h5>Dashboard</h5>
          <div className="top-right-header">
            <span className="admin-role">
              {user ? `${user.user_firstname} ${user.user_lastname}` : 'Instructor'}
            </span>
            <Notifications />
          </div>
        </div>
        <div className="divider"></div>
        <div className='ins-stats-grid'>
              <div className="ins-stat-card courses">
                    <div className="ins-stat-info">
                      <h3>{stats.totalCourses ?? 0}</h3><p>Total Courses</p>
                    </div>
                    <div className="ins-stat-icon">
                      <i className="fas"><FaBook /></i>
                    </div>
                  </div>
        
                  <div className="ins-stat-card students">
                    <div className="ins-stat-info">
                      <h3>{stats.totalStudents ?? 0}</h3><p>Total Students</p>
                    </div>
                    <div className="ins-stat-icon">
                      <i className="fas"><FaUsers /></i>
                    </div>
                  </div>
        
                  <div className="ins-stat-card sessions">
                    <div className="ins-stat-info">
                      <h3>{stats.totalSessions ?? 0}</h3><p>Sessions Today</p>
                    </div>
                    <div className="ins-stat-icon">
                      <i className="fas"><FaTimesCircle /></i>
                    </div>
                  </div>
        </div>
        <div className="bottom-section">
          <div className="schedule-section">
            <div className='schedule-header'>
              <h2>Schedule</h2>
              <div className="filters">
                <label>
                  Day:
                  <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)}>
                    <option>Today</option>
                    <option>Monday</option>
                    <option>Tuesday</option>
                    <option>Wednesday</option>
                    <option>Thursday</option>
                    <option>Friday</option>
                    <option>Saturday</option>
                  </select>
                </label>
              </div>
            </div>
            <table className="schedule-table">
              <thead>
                <tr>
                  <th style={{ width: '50%' }}>Subject</th>
                  <th style={{ width: '30%' }}>Time</th>
                  <th style={{ width: '20%' }}>Room</th>
                </tr>
              </thead>
              <tbody>
                {schedule.filter(row => {
                  if (selectedDay === 'Today') {
                    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
                    return row.day.includes(today);
                  }
                  return row.day.includes(selectedDay);
                }).length === 0 ? (
                  <tr>
                    <td colSpan="3" className="no-data-message">No classes scheduled.</td>
                  </tr>
                ) : (
                  schedule
                    .filter(row => {
                      if (selectedDay === 'Today') {
                        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
                        return row.day.includes(today);
                      }
                      return row.day.includes(selectedDay);
                    })
                    .map((row, i) => (
                      <tr key={i}>
                        <td style={{ width: '50%' }}>{row.subject}</td>
                        <td style={{ width: '30%' }}>{row.time}</td>
                        <td style={{ width: '20%' }}>{row.room}</td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
          <div className="low-attendance">
          <h2>Low Attendance</h2>
          <table>
            <thead>
              <tr>
                <th style={{ width: '50%' }}>Student</th>
                <th style={{ width: '30%' }}>Section</th>
                <th style={{ width: '20%' }}>%</th>
              </tr>
            </thead>
            <tbody>
              {lowAttendance.length === 0 ? (
                <tr>
                  <td colSpan="3" className="no-data-message">No students with low attendance.</td>
                </tr>
              ) : (
                lowAttendance.map((row, i) => (
                  <tr key={i}>
                    <td style={{ width: '50%' }}>{row.student}</td>
                    <td style={{ width: '30%' }}>{row.section}</td>
                    <td style={{ width: '20%' }}>{row.percent}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>   
  );
};

export default InstructorDashboard;