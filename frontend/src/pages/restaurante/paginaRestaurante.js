import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/userContext";

function PaginaRestaurante() {
  const apiRoot = process.env.REACT_APP_API_URL;
  const navigate = useNavigate();

  const { userType, userID, userName, setUserType, setUserID, setUserName } = useUser();

  const [showPerfilOptions, setShowPerfilOptions] = useState(false);
  const [items, setItems] = useState([]);
  const [res, setRes] = useState([]);
  const [showAvaliacoes, setShowAvaliacoes] = useState(false);
  const [avaliacoes, setAvaliacoes] = useState([]);

  // Estados do painel financeiro
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [lucro, setLucro] = useState(null);

  // Função auxiliar para formatar datas para MySQL (YYYY-MM-DD HH:mm:ss)
  const formatarData = (data) => {
    if (!data) return "";
    return data.replace("T", " ") + ":00";
  };

  // Buscar itens do restaurante logado
  const fetchItems = async () => {
    try {
      const response = await fetch(
        `${apiRoot}/listarItensRestaurantePainel?restauranteID=${userID}`
      );
      const data = await response.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar itens do restaurante", error);
      setItems([]);
    }
  };

  // Buscar dados do restaurante logado
  const fetchRestaurantes = async () => {
    try {
      const response = await fetch(
        `${apiRoot}/listarRestaurantes?restauranteID=${userID}`
      );
      if (!response.ok) {
        throw new Error(`Erro na resposta do servidor: ${response.status}`);
      }
      const data = await response.json();
      const restauranteData = Array.isArray(data) ? data[0] : data;
      setRes([restauranteData]);
    } catch (error) {
      console.error("Erro ao buscar restaurante", error);
      setRes([]);
    }
  };

  // Função para buscar avaliações
  const fetchAvaliacoes = async () => {
    try {
      const response = await fetch(
        `${apiRoot}/listarAvaliacoesRestaurante?restauranteID=${userID}`
      );
      const data = await response.json();
      if (Array.isArray(data)) {
        setAvaliacoes(data);
        if (data.length === 0) {
          console.log("Nenhuma avaliação encontrada para este restaurante.");
        }
      } else {
        setAvaliacoes([]);
        console.error("Erro ao buscar avaliações.");
      }
    } catch (error) {
      console.error("Erro ao buscar avaliações", error);
      setAvaliacoes([]);
      console.log("Erro ao conectar com o servidor!");
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
        fetchItems();
      } else {
        console.log("Erro ao trocar disponibilidade");
      }
    } catch (error) {
      console.error("Erro ao trocar disponibilidade", error);
      console.log("Erro ao conectar com o servidor!");
    }
  };

  const handleEditarItemCardapio = (item) => {
    navigate("/editarItemCardapio", { state: item });
  };

  // Função para exibir avaliações
  const handleVerAvaliacoes = () => {
    setShowAvaliacoes(true);
    fetchAvaliacoes();
  };

  // Função para voltar ao cardápio
  const handleVoltar = () => {
    setShowAvaliacoes(false);
    fetchItems();
  };

  // Calcular lucro chamando API
  const calcularLucro = async () => {
    if (!dataInicio || !dataFim) {
      alert("Selecione as datas de início e fim!");
      return;
    }
    try {
      const response = await fetch(
        `${apiRoot}/lucroRestaurante?restauranteID=${userID}&dataInicio=${formatarData(
          dataInicio
        )}&dataFim=${formatarData(dataFim)}`
      );
      const data = await response.json();
      if (response.ok) {
        setLucro(data.lucro);
      } else {
        alert("Erro ao calcular lucro: " + data.error);
      }
    } catch (error) {
      console.error("Erro ao calcular lucro", error);
      alert("Erro ao conectar com o servidor!");
    }
  };

  useEffect(() => {
    if (!userType || userType !== "Restaurante") {
      navigate("/");
    }
    fetchItems();
    fetchRestaurantes();
  }, [userType, userID]);

  const restaurante = res && res.length > 0 ? res[0] : null;

  return (
    <div className="screen no-select">
      <div className="background"></div>
      <header className="header d-flex flex-row justify-content-between p-3">
        <div className="d-flex align-items-center gap-4">
          <div className="header-title" onClick={() => navigate("/paginaRestaurante")}>
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

      <div className="d-flex flex-row">
        <main className="main">
          <h3 className="p-3 menu-title">
            Sua Nota –{" "}
            {restaurante && restaurante.NotaMedia !== null
              ? parseFloat(restaurante.NotaMedia).toFixed(1)
              : "Sem avaliações"}
          </h3>
          <div className="d-flex flex-row align-items-center">
            <h3 className="p-3 menu-title">{showAvaliacoes ? "Avaliações" : "Cardápio"}</h3>
            <i
              className="bi bi-plus-circle add-item-cardapio-icon"
              onClick={() => navigate("/addItemCardapio")}
            ></i>
            {showAvaliacoes ? (
              <button className="red-button p-2 m-2" onClick={handleVoltar}>
                Voltar
              </button>
            ) : (
              <button className="red-button p-2 m-2" onClick={handleVerAvaliacoes}>
                Avaliações
              </button>
            )}
          </div>
          {showAvaliacoes ? (
            <div className="menu-container px-3 d-flex gap-3 flex-wrap">
              {avaliacoes.length > 0 ? (
                avaliacoes.map((avaliacao) => (
                  <div
                    key={avaliacao.PedidoID}
                    className="menu-item p-3 d-flex flex-column col"
                  >
                    <h5>{avaliacao.NomeCliente}</h5>
                    <p className="item-price">Nota: {avaliacao.Nota.toFixed(1)}</p>
                    <p className="menu-item-desc">{avaliacao.Feedback}</p>
                  </div>
                ))
              ) : (
                <div className="d-flex flex-column align-items-center justify-content-center no-select">
                  <h4 className="bold">Nenhuma avaliação encontrada</h4>
                </div>
              )}
            </div>
          ) : (
            <div className="menu-container px-3 d-flex gap-3 flex-wrap">
              {items.length > 0 ? (
                items.map((item) => (
                  <div
                    key={item.PratoID}
                    className="menu-item p-3 d-flex flex-column col"
                  >
                    <div className="image-container mb-3">
                      <img
                        src={`${apiRoot}${item.URL_Imagem}`}
                        alt={item.Nome}
                        className="item-image"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://placehold.co/150x150/d1d5db/374151?text=${encodeURIComponent(
                            item.Nome.substring(0, 10)
                          )}`;
                        }}
                      />
                    </div>
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
          )}

          {/* Painel Financeiro */}
          <div className="finance-panel p-3 mt-4">
            <h3 className="menu-title">Painel Financeiro</h3>
            <div className="d-flex gap-3 align-items-center">
              <div>
                <label>Data Início: </label>
                <input
                  type="datetime-local"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
              </div>
              <div>
                <label>Data Fim: </label>
                <input
                  type="datetime-local"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                />
              </div>
              <button className="red-button p-2" onClick={calcularLucro}>
                Calcular Lucro
              </button>
            </div>
            {lucro !== null && (
              <div className="mt-3">
                <h4>Lucro no período: R$ {parseFloat(lucro).toFixed(2)}</h4>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default PaginaRestaurante;