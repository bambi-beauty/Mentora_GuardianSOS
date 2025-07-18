import React, { useState } from 'react'; // ✅ FIXED: Import useState
import './Home.css';

const Home = () => {
  const [islogedin, setLogin] = useState(false);

  const login = () => {
    setLogin(!islogedin);
  };

  return (
    <div>
      <div>
        <div className='logo'>
          <h1>SKIPS</h1>
        </div>

        <div className="navbar">
          <div className="nav">
            <ul>
              <li><a href="#">Home</a></li> {/* ✅ Use # or Link from react-router-dom */}
              <li><a href="#">About</a></li>
              <li><a href="#">Services</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>

          <button onClick={login}>
            {islogedin ? "Login   " : "Login"}
          </button>
        </div>
      </div>

      <div className="loginform">
        {islogedin && (
          <form>
            <label htmlFor="username">
              <input
                type="text"
                id="username"
                placeholder="Username..."
              />
            </label>
            <br />
            <label htmlFor="password">
              <input
                type="password"
                id="password"
                placeholder="Password..."
              />
            </label>
            <br />
            <button type="submit">Login</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Home;
