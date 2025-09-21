import React from "react";
import { useState } from "react";
import { useUser } from "../../context/userContext";
import { useNavigate } from "react-router-dom";

function Login() {
  const apiRoot = process.env.REACT_APP_API_URL; // URL da API
  const navigate = useNavigate(); // Navegação entre páginas

  const { userID, userType, userName, setUserType, setUserID, setUserName } = useUser(); // Contexto de usuário

  const [inputLogin, setInputLogin] = useState(''); // Estados dos inputs
  const [inputSenha, setInputSenha] = useState(''); // Estados dos inputs

  const handleLogin = async () => {
    if (inputLogin === '' || inputSenha === '') { // Se algum dos campos estiver vazio, não faz nada
      alert("Preencha todos os campos!");
      return;
    }

    try {
      const response = await fetch(`${apiRoot}/login`, { // Faz a requisição de login
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          login: inputLogin,
          senha: inputSenha,
        }),
      });

      if (!response.ok) { // Se a resposta não for ok, exibe mensagem de erro
        console.log(response.status);
        console.log(response.statusText);
        if (response.status === 404) {
          alert("Usuário ou senha incorretos!");
        } else if (response.status === 500) {
          alert("Erro interno do servidor!");
        } else {
          alert("Erro ao fazer login!");
        }
        return;
      } 

      const data = await response.json(); // Pega os dados da resposta

      if (data.userID === null || data.userType === null || data.userName === null) { // Se algum dos dados for nulo, não faz nada
        alert("Erro ao fazer login!");
        return;
      } else {
        setUserID(data.userID);
        setUserType(data.userType);
        setUserName(data.userName);
        navigate(`/pagina${data.userType}`); // Navega para a página do tipo de usuário
      }
    } catch (error) {
      console.log(error);
      alert("Erro ao conectar com o servidor!");
    }
  } 

  return (
    <div className="screen d-flex flex-column align-items-center justify-content-center no-select">
      <div className="background"></div>

      <div className="card col-10 d-flex flex-column align-items-center justify-content-center mt-4 mb-4 p-4" style={{maxWidth: "400px"}}>
        <h4 className="card-title my-4">Bem vindo de volta!</h4>

        {(userID !== null && userType != null) ? ( // Se o usuário já estiver logado, da a opção de logar com outra conta ou logar com a conta atual
          <div className="d-flex flex-column align-items-center">
            <h5 className="card-text text-start align-items-center">Você já está logado como {userName}.</h5>
            <h5 className="card-text text-start align-items-center">Deseja logar com outra conta?</h5>
            <button className="red-button my-3 p-2 col-7" onClick={() => {setUserID(null); setUserType(null);}}>Fazer Login</button>
            <button className="red-button mb-3 p-2 col-7" onClick={() => {navigate(`/pagina${userType}`);}}>Continuar</button>
          </div>
        ) :
        <>
          <div className="mb-2 px-2 d-flex flex-column col-12">
            <h6 className="card-text text-start px-2 mb-1">Usuário</h6>
            <input type="text" className="card-input mb-2 p-2" value={inputLogin} onChange={(e) => setInputLogin(e.target.value)}/>
          </div>

          <div className="mb-2 px-2 d-flex flex-column col-12">
            <h6 className="card-text text-start px-2 mb-1">Senha</h6>
            <input type="password" className="card-input mb-2 p-2" value={inputSenha} onChange={(e) => setInputSenha(e.target.value)}/>
          </div>

          <button className="red-button my-3 p-2 col-7" onClick={() => handleLogin()}>Login</button>

          <div className="d-flex flex-row mt-2 align-items-center mb-1">
            <div className="card-text text-start me-2 align-self-center">Não tem uma conta?</div>
            <div className="card-link text-start align-items-center bold" onClick={() => navigate("/cadastro")}>Cadastre-se</div>
          </div>

          <div className="card-link text-start align-items-center mb-4 bold" onClick={() => navigate("/")}>Voltar a Home</div>
        </>
        }
      </div>
    </div>
  );
}

export default Login;
