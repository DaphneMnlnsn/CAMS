import React, { useEffect, useState } from 'react';
import axios from 'axios';
import LogoutButton from './LogoutButton';
import './AdminUsers.css';
import ImportUsers from './ImportUsers';
import AddUser from './AddUser';
import EditUser from './EditUser';
import Swal from 'sweetalert2';
import {useNavigate} from 'react-router-dom'
import { FaHome, FaUser, FaGraduationCap, FaChartLine, FaFileAlt, FaBook, FaBell, FaRedo, FaPen, FaTrash, FaSearch } from 'react-icons/fa';

function AdminUsers() {
    const [isHovered, setIsHovered] = useState(false);
    const [user, setUser] = useState(null);
    const [users, setUsers] = useState([]);
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedRole, setSelectedRole] = useState("All");
    const [selectedStatus, setSelectedStatus] = useState("All");
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showImportModal, setShowImportModal] = useState(false);

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
        axios.get('http://localhost/cams/backend/getUsers.php', { withCredentials: true })
          .then(res => {
            setUsers(res.data);
          })
          .catch(err => console.error('Error loading users:', err));
      }, []);

      const handleRoleFilter = (e) => {
        setSelectedRole(e.target.value);
      };

      const handleStatusFilter = (e) => {
        setSelectedStatus(e.target.value);
      };

      const handleAddUser = (newUser) => {
        axios.post('http://localhost/cams/backend/addUser.php', newUser, { 
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true })
        .then((res) => {
          setUsers([...users, newUser]);
          Swal.fire({
            icon: 'success',
            title: 'User Added',
            text: 'The user has been added successfully.',
          }).then(() => {
            window.location.reload();
          });
        })
        .catch((err) => {
          console.error('Error adding user:', err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'There was an error adding the user. Please try again.',
          });
        });
      }

      const handleEditUser = (updatedUser) => {
        axios.post('http://localhost/cams/backend/editUser.php', updatedUser, {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true
        })
        .then(res => {
          if (res.data.success) {
            Swal.fire('Success', 'User updated successfully', 'success').then(() => {
              window.location.reload();
            });
          } else {
            Swal.fire('Error', res.data.error || 'Update failed', 'error');
          }
        })
        .catch(err => {
          console.error('Error editing user:', err);
          Swal.fire('Error', 'Something went wrong while updating.', 'error');
        });
      };

      const handleUserAction = (id, action) => {
        if (action === 'archive' && user?.user_id == id) {
          Swal.fire({
            icon: 'warning',
            title: "Action Denied",
            text: "You cannot archive your own account while logged in.",
          });
          return;
        }
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
            axios.post('http://localhost/cams/backend/userAction.php',
              { id, action },
              {
                headers: { 'Content-Type': 'application/json' },
                withCredentials: true
              }
            )
            .then(res => {
              if (res.data.success) {
                Swal.fire('Success', `User ${action}d successfully`, 'success')
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
              <div className="icon icon-active" onClick={() => navigate('/adminUsers')}>
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
            <h5>User List</h5>
            <div className="top-right-header">
              <span className="admin-role">
                {user ? `${user.user_firstname} ${user.user_lastname}` : 'Administrator'}
              </span>
            </div>
          </div>
          <div className="divider"></div>
          <div className="top-bar">
            <div className="search-wrapper">
              <FaSearch className="search-icon"/>
              <input type="text" placeholder="Search" className="search-box"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select className="role-filter"
              value={selectedRole}
              onChange={handleRoleFilter}
            >
              <option value="All">All Roles</option>
              <option value="Student">Student</option>
              <option value="Instructor">Instructor</option>
              <option value="Guidance">Guidance</option>
            </select>
            <select className="role-filter"
              value={selectedStatus}
              onChange={handleStatusFilter}
            >
              <option value="All">All Status</option>
              <option value="0">Active</option>
              <option value="1">Inactive</option>
            </select>
            <button className="view-courses" onClick={() => setShowImportModal(true)}>+ Import Users</button>
            <button className="add-user" onClick={() => setShowAddModal(true)}>+ Add New User</button>
          </div>

          <table className="user-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Birthdate</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? users
              .filter(user => {
                const nameOrEmailMatches = user?.user_firstname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user?.user_lastname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user?.user_email?.toLowerCase().includes(searchQuery.toLowerCase());
                  
                const roleMatches = selectedRole === "All" || user.user_role === selectedRole;
                
                const statusMatches = selectedStatus === "All" || user.archived === selectedStatus;

                return nameOrEmailMatches && roleMatches && statusMatches;
              })
              .map(user => (
                <tr key={user.user_id}>
                  <td>{user.user_id}</td>
                  <td>{user.user_firstname + (user.user_middlename ? ` ${user.user_middlename}` : '') + " " + user.user_lastname}</td>
                  <td>{user.user_email}</td>
                  <td>{user.user_birthdate}</td>
                  <td>{user.user_role}</td>
                  <td>
                    <span className={`status ${user.archived == 0 ? 'active' : 'inactive'}`} id="status-span">
                      {user.archived == 0 ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    {user.archived == 0 ? (
                      <>
                        <button className="icon-btn edit-btn"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowEditModal(true);
                        }}>
                          <FaPen />
                        </button>
                        <button className="icon-btn delete-btn"
                        onClick={() => handleUserAction(user.user_id, 'archive')}>
                          <FaTrash />
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="icon-btn edit-btn"
                        onClick={() => handleUserAction(user.user_id, 'restore')}>
                          <FaRedo />
                        </button>
                        <button className="icon-btn delete-btn"
                        onClick={() => handleUserAction(user.user_id, 'delete')}>
                        <FaTrash />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6">Loading users...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {showAddModal && (
          <AddUser
            onClose={() => setShowAddModal(false)}
            onSave={handleAddUser}
          />
        )}
        {showEditModal && selectedUser && (
          <EditUser
            userData={selectedUser}
            onClose={() => {
              setShowEditModal(false);
              setSelectedUser(null);
            }}
            onSave={handleEditUser}
          />
        )}
        {showImportModal && (
          <ImportUsers
            onClose={() => setShowImportModal(false)}
            onImportSuccess={() => {
              axios.get('http://localhost/cams/backend/getUsers.php', { withCredentials: true })
                .then(res => setUsers(res.data))
                .catch(err => console.error('Error reloading users:', err));
            }}
          />
        )}
      </div>
    );
};

export default AdminUsers;