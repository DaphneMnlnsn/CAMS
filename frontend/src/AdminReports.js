import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import LogoutButton from './LogoutButton';
import './AdminReports.css';
import Swal from 'sweetalert2';
import {useNavigate} from 'react-router-dom'
import { FaHome, FaUser, FaGraduationCap, FaChartLine, FaFileAlt, FaBell, FaBook, FaUsers, FaCheckCircle, FaTimesCircle, FaClock, FaRegClock } from 'react-icons/fa';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

function AdminReports() {
    const [isHovered, setIsHovered] = useState(false);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    const chartRef = useRef(null);

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate]     = useState('');
    const [courseId, setCourseId]   = useState('');
    const [courses, setCourses] = useState([]);

    const [stats, setStats] = useState({
      totalStudents: 0,
      totalInstructors: 0,
      totalSections: 0,
      totalCourses: 0,
      pendingDisputes: 0,
      absentees: 0,
      lateArrivals: 0,
      presentStudents: 0
    });

    const [instructors, setInstructors] = useState([]);
    const [students, setStudents] = useState([]);
    const [instructorTimeRange, setInstructorTimeRange] = useState('this_week');
    const [studentTimeRange, setStudentTimeRange] = useState('this_week');

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

    const fetchReports = () => {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate)   params.endDate   = endDate;
      if (courseId)  params.courseId  = courseId;
      if (instructorTimeRange) params.instructorTimeRange = instructorTimeRange;
      if (studentTimeRange) params.studentTimeRange = studentTimeRange;

      axios.get('http://localhost/cams/backend/getReportsData.php', { withCredentials: true, params })
        .then(res => {
          setCourses(res.data.courses || []);
          setStats(res.data.stats);
          setInstructors(res.data.instructors);
          setStudents(res.data.students);
          if (chartRef.current) chartRef.current.destroy();
          const ctx = canvasRef.current.getContext('2d');
          chartRef.current = new Chart(ctx, {
            type: 'bar',
            data: {
              labels: res.data.chart.labels,
              datasets: [
                {
                  label: 'Present',
                  data: res.data.chart.presentData,
                  backgroundColor: 'rgba(0,112,192,0.7)',
                  borderRadius: 4
                },
                {
                  label: 'Absent',
                  data: res.data.chart.absentData,
                  backgroundColor: 'rgba(255,235,0,0.7)',
                  borderRadius: 4
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              animation: { duration: 1500 },
              scales: { y: { beginAtZero: true } }
            }
          });
        }).catch(err => {
          console.error('Error fetching reports:', err);
          Swal.fire('Error','Unable to load reports data.','error');
        });
      };

      useEffect(() => {
        fetchReports();
      }, [startDate, endDate, courseId, instructorTimeRange, studentTimeRange]);

      const downloadReport = (type) => {
        const params = new URLSearchParams();
        params.append('type', type);

        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (courseId) params.append('courseID', courseId);

        const url = `http://localhost/cams/backend/generateReport.php?${params.toString()}`;
        window.open(url, '_blank');
      };

      const downloadReportNoParams = (type) => {
        const selectedTimeRange = type === 'student' ? studentTimeRange : instructorTimeRange;
        const url = `http://localhost/cams/backend/generateReport.php?type=${encodeURIComponent(type)}&timeRange=${selectedTimeRange}`;
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
            <div className="icon icon-active" onClick={() => navigate('/adminReports')}>
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
            <h5>Reports and Analytics</h5>
            <div className="top-right-header">
              <span className="admin-role">
                {user ? `${user.user_firstname} ${user.user_lastname}` : 'Administrator'}
              </span>
            </div>
          </div>
          <div className="divider"></div>
          <div className="reports-stats-grid-admin">
            {[
              { label: 'Total Students', value: stats.totalStudents },
              { label: 'Total Instructors', value: stats.totalInstructors },
              { label: 'Total Sections', value: stats.totalSections },
              { label: 'Total Courses', value: stats.totalCourses },
              { label: 'Absences', value: stats.absentees },
              { label: 'Late Arrivals', value: stats.lateArrivals },
              { label: 'Presents', value: stats.presentStudents }
            ].map((s, i) => (
              <div className="report-card" key={i}>
                <h3>{s.value}</h3>
                <p>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Chart with dropdown */}
          <div className="chart-filter-row">
            <h4>Average Attendance Rates</h4>
            <div className="table-controls">
              <label>
                From:&nbsp;
                <input
                  type="date"
                  className="filter-select"
                  value={startDate}
                  onChange={e => {
                    const value = e.target.value;
                    setStartDate(value);
                    if (endDate && value > endDate) {
                      setEndDate('');
                    }
                  }}
                  max={new Date().toISOString().split('T')[0]}
                />
              </label>
              <label>
                To:&nbsp;
                <input
                  type="date"
                  className="filter-select"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  min={startDate || undefined}
                  disabled={!startDate}
                />
              </label>
              {(startDate || endDate) && (
                <button className="clear-date-btn" onClick={() => { setStartDate(''); setEndDate(''); }}>
                  Clear
                </button>
              )}
              <select
                className="filter-select"
                value={courseId}
                onChange={e => setCourseId(e.target.value)}
              >
                <option value="">All Courses</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button className="btn-generate-report" onClick={() => downloadReport('attendance')}>
                Generate Report
              </button>
            </div>
          </div>
          <div className="chart-box">
            <canvas ref={canvasRef}></canvas>
          </div>

          {/* Instructor Reports */}
          <div className="table-header">
            <h4>Instructor Reports</h4>
            <div className='table-controls'>
                <select
                className="filter-select"
                value={instructorTimeRange}
                onChange={e => setInstructorTimeRange(e.target.value)}
                >
                    <option value="all_time">All Time</option>
                    <option value="this_week">This Week</option>
                    <option value="this_month">This Month</option>
                    <option value="this_year">This Year</option>
                </select>
                <button className="btn-generate-report" onClick={() => downloadReportNoParams('instructor')}>Generate Report</button>
            </div>
          </div>
          <table className="reports-table">
            <thead>
              <tr>
                <th>Instructor ID</th>
                <th>Name</th>
                <th>Sessions Conducted</th>
              </tr>
            </thead>
            <tbody>
              {instructors.map(i => (
                <tr key={i.id}>
                  <td>{i.id}</td>
                  <td>{i.name}</td>
                  <td>{i.sessions}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Student Reports */}
          <div className="table-header" style={{marginTop: '2rem'}}>
            <h4>Student Reports</h4>
            <div className='table-controls'>
                <select
                className="filter-select"
                value={studentTimeRange}
                onChange={e => setStudentTimeRange(e.target.value)}
                >
                    <option value="all_time">All Time</option>
                    <option value="this_week">This Week</option>
                    <option value="this_month">This Month</option>
                    <option value="this_year">This Year</option>
                </select>
                <button className="btn-generate-report" onClick={() => downloadReportNoParams('student')}>Generate Report</button>
            </div>
          </div>
          <table className="reports-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Total Present</th>
                <th>Total Absents</th>
                <th>Total Lates</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td>{s.name}</td>
                  <td>{s.present}</td>
                  <td>{s.absent}</td>
                  <td>{s.late}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>     
      </div>
    );
};

export default AdminReports;