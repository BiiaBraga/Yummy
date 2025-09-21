import React from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="screen d-flex flex-column align-items-center justify-content-center no-select">
      <div className="background"></div>
      <header className="header d-flex flex-row justify-content-between p-3">
        <div className="d-flex align-items-center gap-4">
          <div className="header-title" onClick={() => navigate("/")}>Food-EUS</div>
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

      <main className="main d-flex p-3 gap-3 flex-column align-items-center justify-content-center">
        <img className="gif" src="/pato-girando.gif" alt="gif"></img>
      </main>
    </div>
  );
}

export default Home;
