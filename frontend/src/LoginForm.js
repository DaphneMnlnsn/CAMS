import React, { useState } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'
import logo from './img/cams-logo.png'
import user from './img/User.png'
import password from './img/Password.png'
import axios from 'axios'
import Swal from 'sweetalert2'
import {useNavigate} from 'react-router-dom'
import './App.css'
import LoginValidation from './LoginValidation'

function LoginForm() {
  const [values, setValues] = useState({
    email: '',
    password: ''
  })
  const navigate = useNavigate();
  const [errors, setErrors] = useState({})
  const handleInput = (event) => {
    setValues(prev => ({...prev, [event.target.name]: event.target.value}))
  }

  const handleSubmit =(event) => {
    event.preventDefault();
    setErrors(LoginValidation(values));
      axios.post('http://localhost/cams/backend/login.php', values, {
        withCredentials: true
      })
      .then(res => {
        if(res.data.message === "Success"){
          const userRole = res.data.role;
          if (userRole === 'Administrator') {
            navigate('/adminDashboard');
          } else if (userRole === 'Instructor') {
            navigate('/instructorDashboard');
          } else if (userRole === 'Guidance') {
            navigate('/guidanceAbsentees');
          } else if (userRole === 'Student'){
            Swal.fire({
            icon: 'error',
            title: 'Mobile Only',
            text: 'Please use your mobile app',
          });
          }
        }
        else{
          Swal.fire({
            icon: 'error',
            title: 'Login Failed',
            text: 'No record exists for this email and password',
          });
          console.log(res);
        }
      })
      .catch(err => console.log(err));
  }
  return (
    <div className="App">
      <div className="log">
        <div className="container">
          <div className="form-box">
            <img src={logo} />
            <h6>Course Attendance Monitoring System</h6>
          </div>
          <div className="overlay-panel overlay-right">
            <form action="" onSubmit={handleSubmit}>
              <div id="login" className="input-group">
                <h4>Welcome Back!</h4>
                <p>Login to Continue</p>
                <div className="input-group mb-3">
                  <span className="input-group-text" id="basic-addon1"><img src={user} width="25px"></img></span>
                  <input type="text" onChange={handleInput} className="form-control" name='email' placeholder="Email" required></input>
                </div>
                <div className="input-group mb-3">
                  <span className="input-group-text" id="basic-addon1"><img src={password} width="25px"></img></span>
                  <input type="password" onChange={handleInput} className="form-control" name='password' placeholder="Password" required></input>
                </div>
                <input type="submit" className="btn btn-primary" value="Log-in"></input>
              </div>
            </form>
          </div>
        </div>
          </div>
      <div className="bgCircle"></div>
    </div>
  );
}

export default LoginForm;
