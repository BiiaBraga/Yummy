import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/userContext";
import { useCart } from "../../context/cartContext";

function PaginaCliente() {
  const apiRoot = process.env.REACT_APP_API_URL;
  const navigate = useNavigate();

  const { userType, userID, userName, setUserType, setUserID, setUserName } = useUser();
  const { cartItems, addToCart, removeFromCart, clearCart, removeFromCartAll } = useCart();

  const [showCart, setShowCart] = useState(true);
  const [showPerfilOptions, setShowPerfilOptions] = useState(false);
  const [items, setItems] = useState([]);
  const [res, setRes] = useState([]);
  const [observacoes, setObservacoes] = useState({});
  const [pesquisa, setPesquisa] = useState("");
  const [selectedRestauranteID, setSelectedRestauranteID] = useState(null);
  // Adicionado: Estados para avaliações
  const [showAvaliacoes, setShowAvaliacoes] = useState(false);
  const [avaliacoes, setAvaliacoes] = useState([]);

  // Buscar itens do cardápio
  const fetchItems = async () => {
    try {
      let url = `${apiRoot}/listarItensRestaurante`;
      if (selectedRestauranteID) {
        url = `${apiRoot}/listarPratosRestaurante?restauranteID=${selectedRestauranteID}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log(error);
      alert("Erro ao conectar com o servidor!");
      setItems([]);
    }
  };

  // Buscar restaurantes (com status de aberto/fechado)
  const fetchRestaurantes = async () => {
    try {
      const response = await fetch(`${apiRoot}/listarRestaurantes`);
      const data = await response.json();
      const restaurantesComStatus = await Promise.all(
        data.map(async (restaurante) => {
          const horarioResponse = await fetch(
            `${apiRoot}/verificarHorarioRestaurante?restauranteID=${restaurante.RestauranteID}`
          );
          const horarioData = await horarioResponse.json();
          return { ...restaurante, Aberto: horarioData.aberto };
        })
      );
      setRes(restaurantesComStatus);
    } catch (error) {
      console.log(error);
      alert("Erro ao conectar com o servidor!");
      setRes([]);
    }
  };

  // Adicionado: Função para buscar avaliações
  const fetchAvaliacoes = async (restauranteID) => {
    try {
      const response = await fetch(`${apiRoot}/listarAvaliacoesRestaurante?restauranteID=${restauranteID}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setAvaliacoes(data);
        if (data.length === 0) {
          alert("Nenhuma avaliação encontrada para este restaurante.");
        }
      } else {
        setAvaliacoes([]);
        alert("Erro ao buscar avaliações.");
      }
    } catch (error) {
      console.log(error);
      alert("Erro ao conectar com o servidor!");
      setAvaliacoes([]);
    }
  };

  const fetchItemsPesquisa = async (pesquisa) => {
    try {
      let url = `${apiRoot}/listarItensPesquisa?pesquisa=${pesquisa}`;
      if (selectedRestauranteID) {
        url += `&restauranteID=${selectedRestauranteID}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      if (Array.isArray(data)) {
        setItems(data);
        if (data.length === 0) {
          alert("Nenhum item encontrado");
        }
      } else {
        setItems([]);
        alert("Erro ao buscar itens pesquisados");
      }
    } catch (error) {
      console.log(error);
      alert("Erro ao conectar com o servidor!");
      setItems([]);
    }
  };

  const handleSairConta = () => {
    setUserType(null);
    setUserID(null);
    setUserName(null);
    navigate("/");
  };

  const handleObservacao = (itemID, observacao) => {
    setObservacoes((prev) => ({ ...prev, [itemID]: observacao }));
  };

  const handleAddToCart = (item) => {
    const observacao = observacoes[item.PratoID] || "";
    item.Observacao = observacao;

    const restaurante = res.find((r) => r.RestauranteID === item.RestauranteID);
    if (!restaurante || !restaurante.Aberto) {
      alert("Este restaurante está fechado no momento.");
      return;
    }

    if (
      cartItems.length > 0 &&
      cartItems[0].RestauranteID !== item.RestauranteID
    ) {
      alert("Você só pode adicionar itens de um único restaurante ao carrinho");
      return;
    }
    setShowCart(true);
    addToCart(item);
  };

  const handlePesquisa = (pesquisa) => {
    if (pesquisa !== "") {
      fetchItemsPesquisa(pesquisa);
    } else {
      fetchItems();
    }
  };

  const handleRestauranteClick = (restauranteID) => {
    setSelectedRestauranteID(restauranteID);
    setPesquisa("");
    setShowAvaliacoes(false); // Esconde avaliações ao selecionar um restaurante
    fetchItems();
  };

  // Adicionado: Função para lidar com o clique no botão Avaliações
  const handleVerAvaliacoes = () => {
    if (selectedRestauranteID) {
      setShowAvaliacoes(true);
      fetchAvaliacoes(selectedRestauranteID);
    }
  };

  const handleVoltar = () => {
    setSelectedRestauranteID(null);
    setPesquisa("");
    setShowAvaliacoes(false); // Esconde avaliações ao voltar
    fetchItems();
  };

  const handleFinalizarPedido = async () => {
    if (cartItems.length === 0) {
      alert("Carrinho vazio");
      return;
    }

    try {
      const response = await fetch(`${apiRoot}/verificarDisponibilidade`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itens: cartItems }),
      });

      const data = await response.json();

      if (Array.isArray(data)) {
        let reload = false;
        data.forEach((item) => {
          const itemLocal = item.Item;
          const disponibilidadeLocal = item.Disponibilidade;
          const restauranteAberto = item.RestauranteAberto;

          if (!restauranteAberto) {
            alert(`O restaurante de ${itemLocal.Nome} está fechado.`);
            removeFromCartAll(itemLocal);
            reload = true;
          } else if (disponibilidadeLocal === 0) {
            alert(`Item ${itemLocal.Nome} esgotado`);
            removeFromCartAll(itemLocal);
            reload = true;
          }
        });
        if (reload) return;
        navigate("/finalizarPedido", { state: { cartItems } });
      } else {
        alert("Erro ao finalizar pedido");
      }
    } catch (error) {
      console.log(error);
      alert("Erro ao conectar com o servidor!");
    }
  };

  useEffect(() => {
    if (!userType || userType !== "Cliente") {
      navigate("/");
    }
    fetchItems();
    fetchRestaurantes();
  }, [selectedRestauranteID]);

  return (
    <div className="screen no-select">
      <div className="background"></div>
      <header className="header d-flex flex-row justify-content-between p-3">
        <div className="d-flex align-items-center gap-4">
          <div className="header-title" onClick={() => {handleVoltar();}}>Yummy</div>
          <div className="header-subtitle p-2" onClick={() => navigate(`/pagina${userType}`)}>
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
          <i className="bi bi-cart header-icon" onClick={() => setShowCart(!showCart)}></i>
          <div className="profile-circle" onClick={() => setShowPerfilOptions(!showPerfilOptions)}></div>
          {showPerfilOptions && (
            <div className="profile-options d-flex flex-column p-3 m-2">
              <h4 className="profile-options-text align-self-center mb-3 bold">
                Olá, {userName}!
              </h4>
              <button className="red-button p-2 mb-2" onClick={() => navigate("/perfil")}>
                Perfil
              </button>
              <button className="red-button p-2 mb-2" onClick={() => navigate("/pedidosCliente")}>
                Pedidos
              </button>
              <button className="red-button p-2" onClick={() => handleSairConta()}>
                Sair
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="d-flex flex-row">
        <main className="main">
          <h3 className="p-3 menu-title">Restaurantes</h3>
          <div className="menu-container px-3 d-flex gap-3 flex-wrap">
            {res.length !== 0 ? (
              res.map((item) => (
                <div
                  key={item.RestauranteID}
                  className="menu-item p-3 d-flex flex-column col"
                  onClick={() => handleRestauranteClick(item.RestauranteID)}
                  style={{ cursor: "pointer" }}
                >
                  <h5>{item.Nome}</h5>
                  <p className="menu-item-desc">{item.Culinaria}</p>
                  <p className="item-price">
                    Nota: {item.NotaMedia !== null ? item.NotaMedia.toFixed(1) : "Sem avaliações"}
                  </p>
                  <p className={item.Aberto ? "text-success" : "text-danger"}>
                    {item.Aberto ? "Aberto" : "Fechado"}
                  </p>
                </div>
              ))
            ) : (
              <div className="d-flex flex-column align-items-center justify-content-center no-select">
                <h4 className="bold">Nenhum restaurante encontrado</h4>
              </div>
            )}
          </div>
          <div className="d-flex align-items-center">
            <h3 className="p-3 menu-title">{showAvaliacoes ? "Avaliações" : "Menu"}</h3>
            {selectedRestauranteID && (
              <>
                <button className="red-button p-2 m-2" onClick={handleVoltar}>
                  Voltar
                </button>
                <button className="red-button p-2 m-2" onClick={handleVerAvaliacoes}>
                  Avaliações
                </button>
              </>
            )}
          </div>
          {showAvaliacoes ? (
            <div className="menu-container px-3 d-flex gap-3 flex-wrap">
              {avaliacoes.length !== 0 ? (
                avaliacoes.map((avaliacao) => (
                  <div key={avaliacao.PedidoID} className="menu-item p-3 d-flex flex-column col">
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
              {items.length !== 0 ? (
                items.map((item) => (
                  <div key={item.PratoID} className="menu-item p-3 d-flex flex-column col">
                    <div className="image-container">
                      <img
                        src={`${apiRoot}${item.URL_Imagem}` || '/caminho/para/imagem/padrao.jpg'}
                        alt={item.Nome}
                        className="item-image"
                      />
                    </div>
                    <div className="item-details">
                      <h5>{item.Nome}</h5>
                      <p className="menu-item-restaurant">Restaurante: {item.NomeRestaurante}</p>
                      <p className="menu-item-categoria">Categoria: {item.NomeCategoria || "Sem categoria"}</p>
                      <p className="menu-item-desc">{item.Descricao}</p>
                      <p className="item-price mt-auto">R$ {item.Preco.toFixed(2)}</p>
                    </div>
                    <input
                      type="text"
                      placeholder="Observação"
                      className="item-observacao mb-2 px-2"
                      onChange={(e) => handleObservacao(item.PratoID, e.target.value)}
                      value={observacoes[item.PratoID] || ""}
                    />
                    <button
                      className="red-button p-2 no-select"
                      onClick={() => handleAddToCart(item)}
                      disabled={!res.find((r) => r.RestauranteID === item.RestauranteID)?.Aberto}
                    >
                      {res.find((r) => r.RestauranteID === item.RestauranteID)?.Aberto
                        ? "Adicionar ao carrinho"
                        : "Restaurante fechado"}
                    </button>
                  </div>
                ))
              ) : (
                <div className="d-flex flex-column align-items-center justify-content-center no-select">
                  <h4 className="bold">Nenhum item encontrado</h4>
                </div>
              )}
            </div>
          )}
        </main>

        {showCart && (
          <aside className="cart p-3 no-select">
            <h3 className="mb-3">Carrinho</h3>
            {cartItems.length === 0 ? (
              <p>Carrinho vazio</p>
            ) : (
              <div className="cart-card d-flex flex-column justify-content-center">
                <div className="cart-itens d-flex flex-column flex-fill mx-2 mb-3">
                  {cartItems.map((item) => (
                    <div key={`${item.PratoID}-${item.Observacao}`}>
                      <div className="d-flex flex-row p-2 mx-2">
                        {item.Nome} - R$ {item.Preco.toFixed(2)}
                        <div className="d-flex gap-1 align-self-end ms-auto">
                          <i className="bi bi-dash-circle cart-icon" onClick={() => removeFromCart(item)}></i>
                          <span>{item.Quantidade}</span>
                          <i className="bi bi-plus-circle cart-icon" onClick={() => addToCart(item)}></i>
                        </div>
                        <i className="bi bi-trash3 cart-icon ms-2" onClick={() => removeFromCartAll(item)}></i>
                      </div>
                      <p className="cart-item mx-3 mb-2">
                        Obs: {item.Observacao}
                      </p>
                    </div>
                  ))}
                </div>
                <hr />
                <p className="d-flex justify-content-end mx-3">
                  Total: R$ {cartItems.reduce((acc, item) => acc + item.Preco * item.Quantidade, 0).toFixed(2)}
                </p>
                <div className="d-flex gap-3 justify-content-center flex-row">
                  <button className="red-button p-2" onClick={clearCart}>
                    Limpar Carrinho
                  </button>
                  <button className="red-button p-2" onClick={() => handleFinalizarPedido()}>
                    Finalizar Pedido
                  </button>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}

export default PaginaCliente;