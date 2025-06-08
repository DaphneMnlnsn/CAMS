import axios from 'axios';
import './AdminDashboard.css'
import { useNavigate } from 'react-router-dom';
import { FaSignOutAlt } from 'react-icons/fa';

function LogoutButton({isHovered}) {
    const navigate = useNavigate();

    const handleLogout = () => {
        axios.get('http://localhost/cams/backend/logout.php', {
        withCredentials: true
        })
        .then(res => {
        console.log(res.data.message);
        navigate('/login');
        })
        .catch(err => {
        console.error("Logout failed", err);
        });
    };

    return (
        <div className="icon" onClick={handleLogout}>
            <FaSignOutAlt title="Logout" />
            {isHovered && <span className="ms-3">Logout</span>}
        </div>
    );
}

export default LogoutButton;