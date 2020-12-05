import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../Logo_text.png';

function Root() {
  return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo"/>
                <div>Welcome to Filigran</div>
                <div><Link to={'/app'}>Access application</Link></div>
            </header>
        </div>
  );
}

export default Root;
