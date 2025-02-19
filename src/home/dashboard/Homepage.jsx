/* eslint-disable no-unused-vars */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from 'react-modal';
import Cookies from 'js-cookie'; // Import js-cookie for session management
import ActionButton from '../../components/ActionButton.jsx';
import { getImagePrefix, projects } from './config.js';
import './HomePage.css';
import { validCredentials } from '../../config/validCredentials.js';
import LoginForm from './LoginForm.jsx'; // Import the new LoginForm component

const HomePage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(true); // Show login modal initially
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loginFields, setLoginFields] = useState({
    accessCode: ''
  });

  const navigate = useNavigate();
  const PROJECTS = projects();

  useEffect(() => {
    // Check if the session cookie is present
    const session = Cookies.get('session_active');
    if (session) {
      setIsAuthenticated(true);
      setLoginModalOpen(false);
    }
  }, []);

  const openCourseModal = (course) => {
    if (course.soon && course.link.length == 0) return;
    setSelectedCourse(course);
    setModalIsOpen(true);
  };

  const closeCourseModal = () => setModalIsOpen(false);

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginFields((prev) => ({ ...prev, [name]: value }));
  };

  const validateLogin = () => {
    const isValid = validCredentials.some(combination =>
      combination.accessCode === loginFields.accessCode 
    );

    if (isValid) {
      const expirationTime = new Date(new Date().getTime() + 4 * 60 * 60 * 1000);
      Cookies.set('session_active', 'true', { expires: expirationTime });
      setIsAuthenticated(true);
      setLoginModalOpen(false);
    } else {
      alert('Invalid input. Please try again.');
    }
  };

  const launchSimulator = (course) => {
    if (course) navigate(course.link);
  };

  return (
    <div className="home-page">
      <div className="header-container">
        <div className="logo-container">
          <img src={getImagePrefix('fixtures/nws_banner.png')} alt="Company Logo" className="logo" />
        </div>
        <div className="description-container">
          <h1>Welcome to the world of Drone Simulator!</h1>
          <p>At NextWaveStem, we empower young innovators to explore the exciting world of drone programming through our interactive simulator. Designed specifically for kids, our platform utilizes Blockly, a visual programming language, to make coding intuitive and fun. Before taking their skills to the skies, users can refine and test their commands in a safe, virtual environment. </p>
          <p>With the DroneBlocks Simulator, you can develop essential programming skills, enhance problem-solving abilities, and build confidence in coding. Whether you want to navigate through challenging tasks or experiment with flight maneuvers, our simulator provides a unique blend of play and education, making learning about drones an engaging adventure!</p>
        </div>
      </div>

      <LoginForm 
        isOpen={loginModalOpen} 
        onClose={() => setLoginModalOpen(false)} 
        loginFields={loginFields} 
        handleLoginChange={handleLoginChange} 
        validateLogin={validateLogin} 
      />

      <Modal isOpen={modalIsOpen} onRequestClose={closeCourseModal} className="modal">
        <ActionButton onClick={closeCourseModal} title="Close" small right />

        <h2>{selectedCourse ? selectedCourse.title : 'Course Details'}</h2>
        <p>{selectedCourse ? selectedCourse.description1 : 'More details about the selected course.'}</p>
        <p>{selectedCourse ? selectedCourse.description2 : ''}</p>

        <ActionButton onClick={() => launchSimulator(selectedCourse)} title="Launch" />
      </Modal>

      <div className="tiles-container">
        {PROJECTS.map((course) => (
          <div key={course.id} className="tile" onClick={() => openCourseModal(course)}>
            {course.soon && <div className="tile-banner">Coming Soon</div>}            
            <img src={course.image} alt={course.title} className="tile-image" />
            <div className="tile-title">{course.title}</div>
            <div className="tile-details">{course.detail}</div>
          </div>
        ))}
      </div>

      <footer className="footer">
         &copy;tanknology
      </footer>
    </div>
  );
};

export default HomePage;