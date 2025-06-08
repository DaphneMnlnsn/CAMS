import React, { useState } from 'react';
import AddHandled from './AddHandled';
import AddStudentsToCourse from './AddStudentsToCourse';

function AddHandledCourse({ onClose, onSave }) {
  const [handledID, setHandledID] = useState(null);
  const [phase, setPhase] = useState('handled');

  const handleHandledCreated = (newID) => {
    setHandledID(newID);
    setPhase('students');
  };

  const handleStudentsDone = (selectedStudents) => {
    onSave({ handledID, students: selectedStudents });
    onClose();
  };

  return (
    <>
      {phase === 'handled' && (
        <AddHandled
          onClose={onClose}
          onHandledCreated={handleHandledCreated}
        />
      )}
      {phase === 'students' && (
        <AddStudentsToCourse
          handledID={handledID}
          onClose={() => {
            handleStudentsDone([]);
          }}
          onSave={handleStudentsDone}
        />
      )}
    </>
  );
}

export default AddHandledCourse;