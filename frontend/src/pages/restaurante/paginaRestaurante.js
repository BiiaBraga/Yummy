import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/userContext";

function PaginaRestaurante() {
  const apiRoot = process.env.REACT_APP_API_URL;
  const navigate = useNavigate();

  const { userType, userID, userName, setUserType, setUserID, setUserName } = useUser();

  const [showPerfilOptions, setShowPerfilOptions] = useState(false);
  const [items, setItems] = useState([]);
  const [pesquisa, setPesquisa] = useState("");
  const [res, setRes] = useState([]);

  // Buscar itens do restaurante logado
  const fetchItems = async () => {
    try {
      const response = await fetch(
        `${apiRoot}/listarItensRestaurante?restauranteID=${userID}`
      );
      const data = await response.json();
      // Garante que data é um array
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar itens do restaurante", error);
      setItems([]); // Define array vazio em caso de erro
    }
  };

  const fetchRestaurantes = async () => {
    try {
      const response = await fetch(
        `${apiRoot}/listarRestaurantes?restauranteID=${userID}`
      );
      if (!response.ok) {
        throw new Error(`Erro na resposta do servidor: ${response.status}`);
      }
      const data = await response.json();
      console.log("Dados brutos do restaurante:", data); // Depuração
      const restauranteData = Array.isArray(data) ? data[0] : data;
      setRes([restauranteData]); // Sempre define como array com o objeto único
      console.log("Res após setRes:", [restauranteData]); // Log imediato
    } catch (error) {
      console.error("Erro ao buscar restaurante", error);
      setRes([]); // Define array vazio em caso de erro
    }
  };

  const fetchItemsPesquisa = async (pesquisa) => {
    try {
      const response = await fetch(
        `${apiRoot}/listarItensPesquisa?pesquisa=${pesquisa}&restauranteID=${userID}`
      );
      const data = await response.json();
      // Garante que data é um array
      if (Array.isArray(data)) {
        setItems(data);
        if (data.length === 0) {
          alert("Nenhum item encontrado");
        }
      } else {
        console.error("Resposta inválida em fetchItemsPesquisa:", data);
        setItems([]);
        alert("Erro ao buscar itens pesquisados");
      }
    } catch (error) {
      console.error("Erro ao buscar itens pesquisados", error);
      setItems([]);
      alert("Erro ao conectar com o servidor!");
    }
  };

  const handleSairConta = () => {
    setUserType(null);
    setUserID(null);
    setUserName(null);
    navigate("/");
  };

  const handleTrocarDisponibilidade = async (pratoID) => {
    try {
      const response = await fetch(
        `${apiRoot}/trocarDisponibilidade?pratoID=${pratoID}`
      );
      const data = await response.json();
      if (data === "OK") {
        fetchItems(); // Recarrega os itens após alterar disponibilidade
      } else {
        alert("Erro ao trocar disponibilidade");
      }
    } catch (error) {
      console.error("Erro ao trocar disponibilidade", error);
      alert("Erro ao conectar com o servidor!");
    }
  };

  const handleEditarItemCardapio = (item) => {
    navigate("/editarItemCardapio", { state: item });
  };

  const handlePesquisa = (pesquisa) => {
    if (pesquisa !== "") {
      fetchItemsPesquisa(pesquisa);
    } else {
      fetchItems();
    }
  };

  useEffect(() => {
    if (!userType || userType !== "Restaurante") {
      navigate("/");
    }
    fetchItems();
    fetchRestaurantes();
  }, []);

  const restaurante = res && res.length > 0 ? res[0] : null;
  console.log("Restaurante no render:", restaurante); // Log no render

  return (
    <div className="screen no-select">
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

        <div className="d-flex align-items-center search-bar gap-3 px-3 col mx-3">
          <i className="bi bi-search search-icon"></i>
          <input
            type="text"
            placeholder="Pesquisar"
            className="search-bar-input"
            onChange={(e) => setPesquisa(e.target.value)}
            value={pesquisa}
            onKeyDown={(e) => e.key === "Enter" && handlePesquisa(pesquisa)}
          />
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

      <div className="d-flex flex-row">
        <main className="main">
          <h3 className="p-3 menu-title">
            Sua Nota –{" "}
            {restaurante && restaurante.NotaMedia !== null
              ? parseFloat(restaurante.NotaMedia).toFixed(1)
              : "Sem avaliações"}
          </h3>
          <div className="d-flex flex-row align-items-center">
            <h3 className="p-3 menu-title">Cardápio</h3>
            <i
              className="bi bi-plus-circle add-item-cardapio-icon"
              onClick={() => navigate("/addItemCardapio")}
            ></i>
          </div>
          <div className="menu-container px-3 d-flex gap-3 flex-wrap">
            {items.length > 0 ? (
              items.map((item) => (
                <div
                  key={item.PratoID}
                  className="menu-item p-3 d-flex flex-column col"
                >
                  <div className="d-flex flex-row align-items-center mb-3">
                    <h5 className="align-self-center m-0">{item.Nome}</h5>
                    {item.Disponibilidade === 1 ? (
                      <p className="menu-item-disp ms-auto align-self-center m-0">
                        Disponível
                      </p>
                    ) : (
                      <p className="menu-item-indisp ms-auto align-self-center m-0">
                        Indisponível
                      </p>
                    )}
                  </div>
                  <p className="menu-item-desc">{item.Descricao}</p>
                  <p className="item-price mt-auto">
                    R$ {parseFloat(item.Preco).toFixed(2)}
                  </p>
                  <button
                    className="red-button p-2 mb-2 no-select"
                    onClick={() => handleEditarItemCardapio(item)}
                  >
                    Editar
                  </button>
                  {item.Disponibilidade === 1 ? (
                    <button
                      className="red-button p-2 no-select"
                      onClick={() => handleTrocarDisponibilidade(item.PratoID)}
                    >
                      Marcar como Indisponível
                    </button>
                  ) : (
                    <button
                      className="red-button p-2 no-select"
                      onClick={() => handleTrocarDisponibilidade(item.PratoID)}
                    >
                      Marcar como Disponível
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="d-flex flex-column align-items-center justify-content-center no-select">
                <h4 className="bold">Nenhum item encontrado</h4>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default PaginaRestaurante;