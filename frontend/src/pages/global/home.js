import React from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="screen" style={{ backgroundImage: 'url("/food-bg.jpg")', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <header className="header-home">
        <div className="d-flex align-items-center gap-4">
          <div className="header-title" onClick={() => navigate("/")}>Yummy</div>
        </div>
        <div className="d-flex flex-row">
          <button className="mx-2 white-button px-4" onClick={() => navigate("/login")}>
            Login
          </button>
          <button className="mx-2 white-button px-4" onClick={() => navigate("/cadastro")}>
            Cadastro
          </button>
        </div>
      </header>

      <main className="main_login">
        <div className="home-content">
          <img 
            src="/logo.png" 
            alt="Yummy Logo" 
            style={{ width: '250px', height: 'auto', marginBottom: '20px' }} 
          />
          <p>Comida Rápida & Deliciosa</p>
          <button 
            className="btn"
            onClick={() => navigate("/login")}
          >
            Explorar o Menu
          </button>
        </div>
      </main>
    </div>
  );
}

export default Home;