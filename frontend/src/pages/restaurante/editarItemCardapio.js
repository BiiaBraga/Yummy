import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../../context/userContext";

function EditarItemCardapio() {
  const navigate = useNavigate();
  const location = useLocation();
  const apiRoot = process.env.REACT_APP_API_URL;

  const { userType, userID, userName, setUserType, setUserID, setUserName } =
    useUser();

  const [showPerfilOptions, setShowPerfilOptions] = useState(false);
  const [item] = useState(location.state);

  const [inputNome, setInputNome] = useState("");
  const [inputDescricao, setInputDescricao] = useState("");
  const [inputPreco, setInputPreco] = useState("");
  const [inputCategoria, setInputCategoria] = useState("");
  const [inputEstoque, setInputEstoque] = useState(0);

  const handleSairConta = () => {
    setUserType(null);
    setUserID(null);
    setUserName(null);
    navigate("/");
  };

  const handleEditarItemCardapio = async () => {
    if (!inputNome || !inputDescricao || !inputPreco) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      const response = await fetch(
        `${apiRoot}/editarItemCardapio?pratoID=${item.PratoID}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nome: inputNome,
            descricao: inputDescricao,
            preco: parseFloat(inputPreco),
            categoriaNome: inputCategoria,
            estoque: parseInt(inputEstoque), // ← adicionado
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        alert(data.message || "Item atualizado com sucesso");
        navigate("/paginaRestaurante");
      } else {
        alert(data.error || "Erro ao atualizar item");
      }
    } catch (error) {
      console.error("Erro ao atualizar item no cardápio", error);
      alert("Erro de conexão com o servidor");
    }
  };

  const handleRemoverItemCardapio = async () => {
    if (!window.confirm("Tem certeza que deseja remover este prato?")) return;

    try {
      const response = await fetch(
        `${apiRoot}/removerItemCardapio?pratoID=${item.PratoID}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (data.success) {
        alert(data.message || "Prato removido com sucesso");
        navigate("/paginaRestaurante");
      } else {
        alert(data.error || "Erro ao remover prato");
      }
    } catch (error) {
      console.error("Erro ao remover prato", error);
      alert("Erro de conexão com o servidor");
    }
  };

  useEffect(() => {
    const fetchItemCompleto = async () => {
      if (!item) return;

      try {
        // Busca os itens do restaurante e encontra o prato que estamos editando
        const response = await fetch(`${apiRoot}/listarItensRestaurante?restauranteID=${item.RestauranteID}`);
        const data = await response.json();
        const pratoAtual = data.find(p => p.PratoID === item.PratoID);

        if (pratoAtual) {
          setInputNome(pratoAtual.Nome);
          setInputDescricao(pratoAtual.Descricao);
          setInputPreco(pratoAtual.Preco);
          setInputEstoque(pratoAtual.Estoque || 0);

          // Busca todas as categorias e encontra o nome pelo CategoriaID
          const responseCat = await fetch(`${apiRoot}/listarCategorias`);
          const categorias = await responseCat.json();
          const cat = categorias.find(c => c.CategoriaID === pratoAtual.CategoriaID);
          setInputCategoria(cat ? cat.NomeCategoria : "");
        }
      } catch (error) {
        console.error("Erro ao buscar dados do prato:", error);
      }
    };

    if (!userType || userType !== "Restaurante" || !userID || !userName || !item) {
      navigate("/paginaRestaurante");
    } else {
      fetchItemCompleto();
    }
  }, []);

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
              <button className="red-button p-2" onClick={handleSairConta}>
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
        <h4 className="card-title my-4">Editar Item do Cardápio</h4>

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

            <div className="mb-2 d-flex flex-column col">
              <h6 className="card-text text-start px-2 mb-1">Estoque</h6>
              <input
                type="number"
                className="card-input mb-2 p-2"
                value={inputEstoque}
                onChange={(e) => setInputEstoque(e.target.value)}
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
              <h6 className="card-text text-start px-2 mb-1">Categoria</h6>
              <input
                type="text"
                className="card-input mb-2 p-2"
                value={inputCategoria}
                onChange={(e) => setInputCategoria(e.target.value)}
              />
            </div>
          </div>
        </div>

        <button
          className="red-button p-2 col-5"
          onClick={handleEditarItemCardapio}
        >
          Atualizar
        </button>

        <button
          className="red-button p-2 col-5 mt-3"
          onClick={handleRemoverItemCardapio}
        >
          Remover prato
        </button>
      </div>
    </div>
  );
}

export default EditarItemCardapio;