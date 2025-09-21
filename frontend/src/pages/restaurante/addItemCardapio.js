import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/userContext";

function AddItemCardapio() {
  const navigate = useNavigate();
  const apiRoot = process.env.REACT_APP_API_URL;

  const { userType, userID, userName, setUserType, setUserID, setUserName } =
    useUser();
  const [showPerfilOptions, setShowPerfilOptions] = useState(false);

  const [inputNome, setInputNome] = useState("");
  const [inputDescricao, setInputDescricao] = useState("");
  const [inputPreco, setInputPreco] = useState("");
  const [inputEstoque, setInputEstoque] = useState("");
  const [inputCategoria, setInputCategoria] = useState("");
  const [inputImagem, setInputImagem] = useState(null); // Estado para a imagem

  const handleSairConta = () => {
    setUserType(null);
    setUserID(null);
    setUserName(null);
    navigate("/");
  };

  const handleAdicionar = async () => {
    if (!inputNome || !inputDescricao || !inputPreco || !inputEstoque) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    // Cria um objeto FormData para enviar dados de formulário e a imagem
    const formData = new FormData();
    formData.append("restauranteID", userID);
    formData.append("nome", inputNome);
    formData.append("descricao", inputDescricao);
    formData.append("preco", inputPreco);
    formData.append("estoque", inputEstoque);
    formData.append("categoriaNome", inputCategoria);
    if (inputImagem) {
      formData.append("imagem", inputImagem);
    }

    try {
      const response = await fetch(`${apiRoot}/adicionarItemCardapio`, {
        method: "POST",
        body: formData, // Envia o FormData no corpo da requisição
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message || "Item adicionado com sucesso!");
        setInputNome("");
        setInputDescricao("");
        setInputPreco("");
        setInputEstoque("");
        setInputCategoria("");
        setInputImagem(null); // Limpa o estado da imagem
      } else {
        alert(data.error || "Erro ao adicionar item");
      }
    } catch (error) {
      console.error("Erro ao adicionar item no cardápio", error);
      alert("Erro de conexão com o servidor");
    }
  };

  useEffect(() => {
    if (!userType || userType !== "Restaurante" || !userID || !userName) {
      navigate("/");
    }
  }, [userType, userID, userName, navigate]);

  return (
    <div className="screen d-flex flex-column align-items-center justify-content-center no-select">
      <div className="background"></div>
      <header className="header d-flex flex-row justify-content-between p-3">
        <div className="d-flex align-items-center gap-4">
          <div className="header-title" onClick={() => navigate("/")}>
            Yummy
          </div>
          <div
            className="header-subtitle p-2"
            onClick={() => navigate(`/pagina${userType}`)}
          >
            Inicio
          </div>
        </div>

        <div className="d-flex align-items-center gap-4">
          <div
            className="profile-circle"
            onClick={() => setShowPerfilOptions(!showPerfilOptions)}
          ></div>
          {showPerfilOptions && (
            <div className="profile-options d-flex flex-column p-3 m-2">
              <h4 className="profile-options-text align-self-center mb-3 bold">
                Olá, {userName}!
              </h4>
              <button
                className="red-button p-2 mb-2"
                onClick={() => navigate("/perfil")}
              >
                Perfil
              </button>
              <button
                className="red-button p-2 mb-2"
                onClick={() => navigate("/pedidosRestaurante")}
              >
                Pedidos
              </button>
              <button
                className="red-button p-2"
                onClick={() => handleSairConta()}
              >
                Sair
              </button>
            </div>
          )}
        </div>
      </header>

      <div
        className="card col-10 d-flex flex-column align-items-center justify-content-center mt-4 mb-4 p-4"
        style={{ maxWidth: "43rem" }}
      >
        <h4 className="my-4">Adicionar item ao cardápio</h4>

        <div className="col-12">
          <div className="row d-flex flex-wrap">
            <div className="mb-2 d-flex flex-column col">
              <h6 className="card-text text-start px-2 mb-1">Nome</h6>
              <input
                type="text"
                className="card-input mb-2 p-2"
                value={inputNome}
                onChange={(e) => setInputNome(e.target.value)}
              />
            </div>

            <div className="mb-2 d-flex flex-column col">
              <h6 className="card-text text-start px-2 mb-1">Preço</h6>
              <input
                type="number"
                className="card-input mb-2 p-2"
                value={inputPreco}
                onChange={(e) => setInputPreco(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="row d-flex flex-wrap">
            <div className="mb-2 d-flex flex-column col">
              <h6 className="card-text text-start px-2 mb-1">Descrição</h6>
              <input
                type="text"
                className="card-input mb-2 p-2"
                value={inputDescricao}
                onChange={(e) => setInputDescricao(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="row d-flex flex-wrap">
            <div className="mb-2 d-flex flex-column col">
              <h6 className="card-text text-start px-2 mb-1">Estoque</h6>
              <input
                type="number"
                className="card-input mb-2 p-2"
                value={inputEstoque}
                onChange={(e) => setInputEstoque(e.target.value)}
              />
            </div>

            <div className="mb-2 d-flex flex-column col">
              <h6 className="card-text text-start px-2 mb-1">Categoria (opcional)</h6>
              <input
                type="text"
                className="card-input mb-2 p-2"
                value={inputCategoria}
                onChange={(e) => setInputCategoria(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="row d-flex flex-wrap">
            <div className="mb-2 d-flex flex-column col">
              <h6 className="card-text text-start px-2 mb-1">Imagem</h6>
              <input
                type="file"
                className="card-input mb-2 p-2"
                onChange={(e) => setInputImagem(e.target.files[0])}
              />
            </div>
          </div>
        </div>

        <button className="red-button p-2 col-5" onClick={handleAdicionar}>
          Adicionar
        </button>
      </div>
    </div>
  );
}

export default AddItemCardapio;