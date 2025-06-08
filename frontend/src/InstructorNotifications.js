import React, { useEffect, useState } from 'react';
import axios from 'axios';
import LogoutButton from './LogoutButton';
import './InstructorNotifications.css';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaGraduationCap, FaChartLine, FaBook } from 'react-icons/fa';
import Swal from 'sweetalert2';

function InstructorNotifications() {
    const [isHovered, setIsHovered] = useState(false);
    const [user, setUser] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        axios.get('http://localhost/cams/backend/checkSession.php', {
            withCredentials: true
        }).then(res => {
            if (res.data.loggedIn) {
                setUser(res.data);
            } else {
                navigate('/login');
            }
        }).catch(err => console.error(err));
    }, []);

    useEffect(() => {
        if (user?.user_role && user.user_role !== 'Instructor') {
            Swal.fire({
                icon: 'error',
                title: 'Access Denied',
                text: 'You do not have permission to access this page.',
                backdrop: `rgba(0, 0, 0, 1.0)`
            }).then(() => {
                if (user.user_role === 'Administrator') {
                    navigate('/adminDashboard');
                } else {
                    navigate('/guidanceAbsentees');
                }
            });
        }
    }, [user?.user_role]);

    useEffect(() => {
        axios.get('http://localhost/cams/backend/getNotifications.php', {
            withCredentials: true
        })
        .then(res => {
            if (res.data.notifications) {
                setNotifications(res.data.notifications);
            }
        })
        .catch(err => console.error('Error fetching notifications:', err));
    }, []);

    const markAsRead = (id) => {
        axios.post('http://localhost/cams/backend/markNotif.php', { id }, { withCredentials: true })
            .then(res => {
                if (res.data.success) {
                    setNotifications(prev =>
                        prev.map(n => n.id === id ? { ...n, status: 'read' } : n)
                    );
                }
            })
            .catch(err => console.error('Failed to mark as read:', err));
    };

    return (
        <div>
            {/* Sidebar */}
            <div className="sidebar" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
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
                    <div className="icon" onClick={() => navigate('/instructorReports')}>
                        <FaChartLine title="Reports" />
                        {isHovered && <span className="ms-3">Reports</span>}
                    </div>
                    <LogoutButton isHovered={isHovered} />
                </nav>
            </div>

            {/* Main Content */}
            <div className="main-content">
                <div className="header-row">
                    <h5>All Notifications</h5>
                    <div className="top-right-header">
                        <span className="admin-role">
                            {user ? `${user.user_firstname} ${user.user_lastname}` : 'Instructor'}
                        </span>
                    </div>
                </div>

                <div className="divider"></div>

                <table className="log-table">
                    <thead>
                        <tr>
                            <th>Message</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th style={{textAlign:'center'}}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {notifications.length > 0 ? (
                            notifications.map(notification => (
                                <tr key={notification.id}>
                                    <td>{notification.message}</td>
                                    <td>{new Date(notification.date).toLocaleString()}</td>
                                    <td>
                                        <span className={notification.status === 'Unread' ? 'status-unread' : 'status-read'}>
                                            {notification.status}
                                        </span>
                                    </td>
                                    <td style={{textAlign:'center'}}>
                                        {notification.status === 'Unread' ? (
                                            <button className="mark-read" onClick={() => markAsRead(notification.id)}>
                                                Mark as Read
                                            </button>
                                        ) : (
                                            <span className="text-muted">—</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="no-records">No notifications found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default InstructorNotifications;
