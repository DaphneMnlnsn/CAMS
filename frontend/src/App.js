import React from 'react'
import LoginForm from './LoginForm'
import AdminDashboard from './AdminDashboard'
import AdminCourses from './AdminCourses'
import AdminLogs from './AdminLogs'
import AdminReports from './AdminReports'
import AdminSections from './AdminSections'
import AdminUsers from './AdminUsers'
import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom'
import AdminCoursesArchive from './AdminCoursesArchive'
import AdminSectionsArchive from './AdminSectionsArchive'
import InstructorDashboard from './InstructorDashboard'
import InstructorCourses from './InstructorCourses'
import InstructorCoursesArchive from './InstructorCoursesArchive'
import InstructorCourseDetails from './InstructorCourseDetails'
import InstructorStudents from './InstructorStudents'
import InstructorReports from './InstructorReports'
import InstructorNotifications from './InstructorNotifications'
import GuidanceAbsentees from './GuidanceAbsentees'
import GuidanceCalledStudents from './GuidanceCalledStudents'

function App(){
  return(
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Administrators */}
        <Route path='/login' element={<LoginForm />}></Route>
        <Route path='/adminDashboard' element={<AdminDashboard />}></Route>
        <Route path='/adminUsers' element={<AdminUsers />}></Route>
        <Route path='/adminCourses' element={<AdminCourses />}></Route>
        <Route path='/adminSections' element={<AdminSections />}></Route>
        <Route path='/adminReports' element={<AdminReports />}></Route>
        <Route path='/adminLogs' element={<AdminLogs />}></Route>
        <Route path='/adminCoursesArchive' element={<AdminCoursesArchive />}></Route>
        <Route path='/adminSectionsArchive' element={<AdminSectionsArchive />}></Route>

        {/* Instructors */}
        <Route path='/instructorDashboard' element={<InstructorDashboard />}></Route>
        <Route path='/instructorCourses' element={<InstructorCourses />}></Route>
        <Route path='/instructorCoursesArchive' element={<InstructorCoursesArchive />}></Route>
        <Route path='/instructorCourseDetails/:courseassign_id' element={<InstructorCourseDetails />}></Route>
        <Route path='/instructorStudents' element={<InstructorStudents />}></Route>
        <Route path='/instructorReports' element={<InstructorReports />}></Route>
        <Route path='/instructorNotifications' element={<InstructorNotifications />}></Route>

        {/* Guidance Officers */}
        <Route path='/guidanceAbsentees' element={<GuidanceAbsentees />}></Route>
        <Route path='/guidanceCalledStudents' element={<GuidanceCalledStudents />}></Route>
      
      </Routes>
    </BrowserRouter>
  )
}

export default App