import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import LogoutButton from './LogoutButton';
import './AdminDashboard.css';
import Swal from 'sweetalert2';
import {useNavigate} from 'react-router-dom'
import { FaHome, FaUser, FaGraduationCap, FaChartLine, FaFileAlt, FaBell, FaBook, FaUsers, FaCheckCircle, FaTimesCircle, FaClock, FaRegClock } from 'react-icons/fa';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

function AdminDashboard() {
    const [isHovered, setIsHovered] = useState(false);
    const [user, setUser] = useState(null); 
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    const chartInstanceRef = useRef(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [totalStudents, setTotalStudents] = useState(0);
    const [presentCount, setPresentCount] = useState(0);
    const [absentCount, setAbsentCount] = useState(0);
    const [lateCount, setLateCount] = useState(0);
    const [activityLog, setActivityLog] = useState([]);

    const sampleData = {
      labels: ['25', '30', '35', '40', '45', '50'],
      datasets: [
        {
          label: 'Present',
          data: [80, 60, 90, 100, 55, 85],
          backgroundColor: 'rgba(0,112,192,0.7)',
          borderRadius: 4,
        },
        {
          label: 'Absent',
          data: [50, 70, 20, 80, 45, 75],
          backgroundColor: 'rgba(255,235,0,0.7)',
          borderRadius: 4,
        }
      ]
    };

    useEffect(() => {
      const timer = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(timer);
    }, []);

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
      if (!canvasRef.current) return;

      axios.get('http://localhost/cams/backend/getDashboardData.php', {
        withCredentials: true
      })
      .then(res => {
        const stats = res.data?.stats || {};
        const chart = res.data?.attendanceChart || {};

        const labels = chart.labels || [];
        const present = chart.presentData || [];
        const absent = chart.absentData || [];

        setTotalStudents(stats.totalStudents || 0);
        setPresentCount(stats.present || 0);
        setAbsentCount(stats.absent || 0);
        setLateCount(stats.late || 0);
        setActivityLog(res.data?.activityLog || []);

        if (chartInstanceRef.current) {
          chartInstanceRef.current.destroy();
        }

        if (labels.length && present.length && absent.length) {
          const ctx = canvasRef.current.getContext('2d');
          chartInstanceRef.current = new Chart(ctx, {
            type: 'bar',
            data: {
              labels: labels,
              datasets: [
                {
                  label: 'Present',
                  data: present,
                  backgroundColor: 'rgba(0,112,192,0.7)',
                  borderRadius: 4,
                },
                {
                  label: 'Absent',
                  data: absent,
                  backgroundColor: 'rgba(255,235,0,0.7)',
                  borderRadius: 4,
                }
              ]
            },
            options: {
              animation: { duration: 1500 },
              plugins: { tooltip: { enabled: true } },
              scales: { x: { stacked: false }, y: { beginAtZero: true } }
            }
          });
        } else {
          console.warn("Empty chart data received.");
        }
      })
      .catch(err => {
        console.error("Error fetching dashboard data:", err);
      });

      return () => {
        chartInstanceRef.current?.destroy();
      };
    }, []);

    return (
      <div>
        {/* Navigation Bar */}
        <div className="sidebar" onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}>
        <h5 className="logo">CAMS</h5>
        <nav className="nav">
            <div className="icon icon-active" onClick={() => navigate('/adminDashboard')}>
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
            <div className="icon" onClick={() => navigate('/adminLogs')}>
                <FaFileAlt title="Activity Log" />
                {isHovered && <span className="ms-3">Activity Log</span>}
            </div>
            <LogoutButton isHovered={isHovered} />
        </nav>
        </div>
        <div className="main-content">
          <div className="header-row">
            <h5>Dashboard</h5>
            <div className="top-right-header">
              <span className="admin-role">
                {user ? `${user.user_firstname} ${user.user_lastname}` : 'Administrator'}
              </span>
            </div>
          </div>
          <div className="divider"></div>
          <div className="stats-grid">
            <div className="time-card">
            <div className="time-icon">
              <i className="fas"><FaRegClock /></i>
            </div>
            <div className="time-details">
              <h3>
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </h3>
              <p>Realtime Insight</p>
              <p className='today'>Today: {currentTime.toLocaleDateString([], {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
              </p>
            </div>
          </div>
          <div className="stat-card total">
            <div className="stat-info">
              <h3>{totalStudents}</h3><p>Total Students</p>
            </div>
            <div className="stat-icon" style={{ color: '#0070C0' }}>
              <i className="fas"><FaUsers /></i>
            </div>
          </div>

          <div className="stat-card present">
            <div className="stat-info">
              <h3>{presentCount}</h3><p>Present</p>
            </div>
            <div className="stat-icon" style={{ color: '#28A745' }}>
              <i className="fas"><FaCheckCircle /></i>
            </div>
          </div>

          <div className="stat-card absent">
            <div className="stat-info">
              <h3>{absentCount}</h3><p>Absent</p>
            </div>
            <div className="stat-icon" style={{ color: '#DC3545' }}>
              <i className="fas"><FaTimesCircle /></i>
            </div>
          </div>

          <div className="stat-card late">
            <div className="stat-info">
              <h3>{lateCount}</h3><p>Late Arrivals</p>
            </div>
            <div className="stat-icon" style={{ color: '#a07903' }}>
              <i className="fas"><FaClock /></i>
            </div>
          </div>
          </div>

          <div className="bottom-section">
          <div className="chart-container">
            <h4>Attendance Rates</h4>
            <canvas ref={canvasRef}></canvas>
          </div>

          <div className="activity-log">
            <h4>Today Activity</h4>
            <ul>
              {activityLog.length === 0 ? (
                <li>No activity for today.</li>
              ) : (
                activityLog.map((log, index) => (
                  <li key={index}>
                    <b>{log.user} -</b> {log.action}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
        </div>        
      </div>

    );
};

export default AdminDashboard;