import React from "react";
import { useState } from "react";
import { useUser } from "../../context/userContext";
import { useNavigate } from "react-router-dom";

function Login() {
  const apiRoot = process.env.REACT_APP_API_URL; // URL da API
  const navigate = useNavigate(); // Navegação entre páginas

  const { userID, userType, userName, setUserType, setUserID, setUserName } = useUser(); // Contexto de usuário

  const [inputLogin, setInputLogin] = useState(''); 
  const [inputSenha, setInputSenha] = useState(''); 

  const handleLogin = async () => {
    if (inputLogin === '' || inputSenha === '') { 
      alert("Preencha todos os campos!");
      return;
    }

    try {
      const response = await fetch(`${apiRoot}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          login: inputLogin,
          senha: inputSenha,
        }),
      });

      if (!response.ok) { 
        if (response.status === 404) {
          alert("Usuário ou senha incorretos!");
        } else if (response.status === 500) {
          alert("Erro interno do servidor!");
        } else {
          alert("Erro ao fazer login!");
        }
        return;
      } 

      const data = await response.json(); 

      if (data.userID === null || data.userType === null || data.userName === null) { 
        alert("Erro ao fazer login!");
        return;
      } else {
        setUserID(data.userID);
        setUserType(data.userType);
        setUserName(data.userName);
        navigate(`/pagina${data.userType}`); 
      }
    } catch (error) {
      console.log(error);
      alert("Erro ao conectar com o servidor!");
    }
  } 

  return (
    <div 
      className="screen d-flex flex-column justify-content-center" 
      style={{ 
        backgroundImage: 'url("/fundo-login.png")', 
        backgroundSize: 'cover', 
        backgroundPosition: 'center', 
        alignItems: 'flex-end' 
      }}
    >
      <div className="card d-flex flex-column align-items-center justify-content-center p-5 login-card">
        <img 
          src="/logo.png" 
          alt="Yummy Logo" 
          className="login-logo"
        />
        <h4 className="card-title my-4">Bem-vindo de volta!</h4>

        {(userID !== null && userType != null) ? (
          <div className="d-flex flex-column align-items-center" style={{ marginTop: 'auto', marginBottom: 'auto' }}>
            <h5 className="card-text text-start align-items-center">Você já está logado como {userName}.</h5>
            <h5 className="card-text text-start align-items-center">Deseja logar com outra conta?</h5>
            <button className="red-button my-3 p-2" style={{ width: '200px' }} onClick={() => {setUserID(null); setUserType(null);}}>Fazer Login</button>
            <button className="red-button mb-3 p-2" style={{ width: '200px' }} onClick={() => {navigate(`/pagina${userType}`);}}>Continuar</button>
          </div>
        ) : (
          <>
            <div className="mb-3 px-2 d-flex flex-column" style={{ width: '80%' }}>
              <h6 className="card-text text-start px-2 mb-1">Usuário</h6>
              <input 
                type="text" 
                className="card-input mb-2 p-2" 
                value={inputLogin} 
                onChange={(e) => setInputLogin(e.target.value)} 
                style={{ width: '100%' }}
              />
            </div>

            <div className="mb-3 px-2 d-flex flex-column" style={{ width: '80%' }}>
              <h6 className="card-text text-start px-2 mb-1">Senha</h6>
              <input 
                type="password" 
                className="card-input mb-2 p-2" 
                value={inputSenha} 
                onChange={(e) => setInputSenha(e.target.value)} 
                style={{ width: '100%' }}
              />
            </div>

            <button className="red-button my-3 p-2" style={{ width: '200px' }} onClick={() => handleLogin()}>Login</button>

            <div className="d-flex flex-row mt-2 align-items-center mb-1">
              <div className="card-text text-start me-2 align-self-center">Não tem uma conta?</div>
              <div className="card-link text-start align-items-center bold" onClick={() => navigate("/cadastro")}>Cadastre-se</div>
            </div>

            <div className="card-link text-start align-items-center mb-4 bold" onClick={() => navigate("/")}>Voltar à Home</div>
          </>
        )}
      </div>
    </div>
  );
}

export default Login;