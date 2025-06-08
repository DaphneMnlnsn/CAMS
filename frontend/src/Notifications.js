import React, { useState, useEffect, useRef } from "react";
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaBell } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./Notifications.css";

const Notifications = () => {
  const [prevLength, setPrevLength] = useState(0);
  const [show, setShow] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const popupRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      axios.get("http://localhost/cams/backend/checkNotifications.php", {
        withCredentials: true
      })
      .then(() => {
        return axios.get("http://localhost/cams/backend/getNotifications.php", {
          withCredentials: true
        });
      })
      .then((res) => {
        const newNotifications = res.data.notifications || [];

        setPrevLength((prev) => {
          if (newNotifications.length > prev) {
            Swal.fire({
              icon: 'info',
              title: 'New Notification',
              text: 'You have a new notification!',
              timer: 3000,
              showConfirmButton: false,
              toast: true,
              position: 'top-end'
            });
          }

          return newNotifications.length;
        });

        setNotifications(newNotifications);
      })
      .catch(err => console.error("Notification fetch error:", err));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchNotifications = () => {
      axios.get("http://localhost/cams/backend/checkNotifications.php", {
        withCredentials: true
      })
      .then(() => {
        return axios.get("http://localhost/cams/backend/getNotifications.php", {
          withCredentials: true
        });
      })
      .then((res) => {
        const newNotifications = res.data.notifications || [];
        setNotifications(newNotifications);
        setPrevLength(newNotifications.length);
      })
      .catch(err => console.error("Initial notification fetch error:", err));
    };

    fetchNotifications();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setShow(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => n.status === "unread").length;

  const handleSeeAll = (e) => {
    e.stopPropagation();
    navigate('/instructorNotifications');
  };

  return (
    <div ref={popupRef} className="notification-bell" onClick={() => setShow(!show)}>
      <FaBell className="bell-icon" />
      {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
      {show && (
        <div className="notification-list">
          {notifications.length === 0 ? (
            <div className="notification-item">No new notifications</div>
          ) : (
            <>
              {notifications.slice(0, 5).map((notif, index) => (
                <div key={index} className="notification-item">
                  {notif.message}
                </div>
              ))}
              <div className="notification-footer">
                <button onClick={handleSeeAll} className="see-all-btn">
                  See All
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;
