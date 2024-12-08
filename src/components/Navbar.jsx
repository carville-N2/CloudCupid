import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';  // Import the CSS for the navbar
import Logo from '../assets/logo.jpeg'; // Import the logo image

const Navbar = () => {
  return (
    <nav className="navbar">
        <h2> Cloud Cupid </h2>
      <div className="navbar-logo">
        {/* Logo */}
        <img src={Logo} className="logo" />
      </div>
      <ul className="navbar-links">
        <li>
          <Link to="/" className="navbar-link">Home</Link>
        </li>
        <li>
          <Link to="/profile" className="navbar-link">Create New User Profile</Link>
        </li>
        <li>
          <Link to="/gallery" className="navbar-link">User Gallery</Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
