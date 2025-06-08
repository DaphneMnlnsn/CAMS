import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import LogoutButton from './LogoutButton';
import Notifications from './Notifications';
import './InstructorReports.css';
import Swal from 'sweetalert2';
import {useNavigate} from 'react-router-dom'
import { FaHome, FaGraduationCap, FaChartLine, FaBell, FaBook } from 'react-icons/fa';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

function InstructorReports() {
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
    totalCourses: 0,
    absentees: 0,
    lateArrivals: 0,
    presentStudents: 0
  });

  const [attendance, setAttendance] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendanceTimeRange, setAttendanceTimeRange] = useState('this_week');
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

  const fetchReports = () => {
  const params = {};
  if (startDate) params.startDate = startDate;
  if (endDate)   params.endDate   = endDate;
  if (courseId)  params.courseId  = courseId;
  if (attendanceTimeRange) params.attendanceTimeRange = attendanceTimeRange;
  if (studentTimeRange) params.studentTimeRange = studentTimeRange;

  axios.get('http://localhost/cams/backend/getInstructorReports.php', { withCredentials: true, params })
    .then(res => {
      setCourses(res.data.courses || []);
      setStats(res.data.stats);
      setAttendance(res.data.attendance);
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
  }, [startDate, endDate, courseId, attendanceTimeRange, studentTimeRange]);

  const downloadReport = (type) => {
    const params = new URLSearchParams();
    params.append('type', type);

    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (courseId) params.append('courseId', courseId);

    const url = `http://localhost/cams/backend/generateReport.php?${params.toString()}`;
    window.open(url, '_blank');
  };

  const downloadReportNoParams = (type) => {
    const selectedTimeRange = type === 'instructorStudents' ? studentTimeRange : attendanceTimeRange;
    const url = `http://localhost/cams/backend/generateReport.php?type=${encodeURIComponent(type)}&timeRange=${selectedTimeRange}`;
    window.open(url, '_blank');
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
            <div className="icon" onClick={() => navigate('/instructorCourses')}>
                <FaBook title="Courses" />
                {isHovered && <span className="ms-3">Courses</span>}
            </div>
            <div className="icon" onClick={() => navigate('/instructorStudents')}>
                <FaGraduationCap title="Students" />
                {isHovered && <span className="ms-3">Students</span>}
            </div>
            <div className="icon icon-active" onClick={() => navigate('/instructorReports')}>
                <FaChartLine title="Reports" />
                {isHovered && <span className="ms-3">Reports</span>}
            </div>
            <LogoutButton isHovered={isHovered} />
        </nav>
      </div>
      <div className="main-content">
        <div className="header-row">
          <h5>Reports and Analytics</h5>
          <div className="top-right-header">
            <span className="admin-role">
              {user ? `${user.user_firstname} ${user.user_lastname}` : 'Instructor'}
            </span>
            <Notifications />
          </div>
        </div>
        <div className="divider"></div>
        <div className="reports-stats-grid">
          {[
            { label: 'Total Students', value: stats.totalStudents },
            { label: 'Total Assigned Courses', value: stats.totalCourses },
            { label: 'Total Sessions Made', value: stats.totalSessions },
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
            <button className="btn-generate-report" onClick={() => downloadReport('instructorChart')}>
              Generate Report
            </button>
          </div>
        </div>
        <div className="chart-box">
          <canvas ref={canvasRef}></canvas>
        </div>

        {/* Attendance Summary Reports */}
        <div className="table-header">
          <h4>Attendance Summary</h4>
          <div className='table-controls'>
              <select
              className="filter-select"
              value={attendanceTimeRange}
              onChange={e => setAttendanceTimeRange(e.target.value)}
              >
                  <option value="all_time">All Time</option>
                  <option value="this_week">This Week</option>
                  <option value="this_month">This Month</option>
                  <option value="this_year">This Year</option>
              </select>
              <button className="btn-generate-report" onClick={() => downloadReportNoParams('instructorAttendance')}>Generate Report</button>
          </div>
        </div>
        <table className="reports-table">
          <thead>
            <tr>
              <th>Course Name</th>
              <th>Total Sessions</th>
              <th>Presents</th>
              <th>Absents</th>
              <th>Lates</th>
              <th>Attendance Rate</th>
            </tr>
          </thead>
          <tbody>
            {attendance.map(a => (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td>{a.sessions}</td>
                <td>{a.presents}</td>
                <td>{a.absents}</td>
                <td>{a.lates}</td>
                <td>{a.rates}%</td>
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
              <button className="btn-generate-report" onClick={() => downloadReportNoParams('instructorStudents')}>Generate Report</button>
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
              <th>Attendance Rate</th>
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
                <td>{s.rate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InstructorReports;