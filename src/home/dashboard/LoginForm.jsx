/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import Modal from 'react-modal';
import ActionButton from '../../components/ActionButton.jsx';
import './loginForm.css'; // Import the CSS file for styles

const LoginForm = ({ isOpen, onClose, loginFields, handleLoginChange, validateLogin }) => {
  return (
    <Modal isOpen={isOpen} className="modal" ariaHideApp={false}>
      <div className="login-form">
        <h2 className="login-title">Login Required</h2>
        <form onSubmit={(e) => { e.preventDefault(); validateLogin(); }}>
          <div className="login-field">
            <label htmlFor="accessCode">Access Code:</label>
            <input
              type="text"
              name="accessCode"
              id="accessCode"
              value={loginFields.accessCode}
              onChange={handleLoginChange}
              required
            />
          </div>
          <ActionButton onClick={validateLogin} title="Login" />
        </form>
      </div>
    </Modal>
  );
};

export default LoginForm;
