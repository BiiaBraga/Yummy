import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/userContext";

function PedidosCliente() {
  const apiRoot = process.env.REACT_APP_API_URL;
  const navigate = useNavigate();

  const { userType, userID, userName, setUserType, setUserID, setUserName } =
    useUser();

  const [showPerfilOptions, setShowPerfilOptions] = useState(false);
  const [items, setItems] = useState([]);

  const fetchItems = async () => {
    try {
      const response = await fetch(
        `${apiRoot}/listarPedidosCliente?clienteID=${userID}`
      );
      if (!response.ok) {
        console.log(response.statusText);
      } else {
        const data = await response.json();
        if (data) setItems(data);
      }
    } catch (error) {
      console.log(error);
      alert("Erro ao conectar com o servidor!");
    }
  };

  const handleConfirmarEntrega = async (pedidoID) => {
    try {
      const response = await fetch(
        `${apiRoot}/confirmarEntrega?pedidoID=${pedidoID}`
      );
      const data = await response.json();
      if (data === "OK") fetchItems();
    } catch (error) {
      console.log(error);
      alert("Erro ao conectar com o servidor!");
    }
  };

  const handleCancelarPedido = async (pedidoID) => {
    try {
      const response = await fetch(
        `${apiRoot}/cancelarPedido?pedidoID=${pedidoID}`
      );
      const data = await response.json();
      if (data === "OK") fetchItems();
    } catch (error) {
      console.log(error);
      alert("Erro ao conectar com o servidor!");
    }
  };

  const handleAvaliarPedido = (pedido) => {
    navigate("/avaliarPedido", { state: pedido });
  };

  const handleSairConta = () => {
    setUserType(null);
    setUserID(null);
    setUserName(null);
    navigate("/");
  };

  useEffect(() => {
    if (!userType || userType !== "Cliente") {
      navigate("/");
    }
    fetchItems();
    const intervalId = setInterval(() => fetchItems(), 10000);
    return () => clearInterval(intervalId);
  }, [userType, navigate]);

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
                onClick={() => navigate("/pedidosCliente")}
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

      <main className="main">
        <div className="d-flex flex-row align-items-center">
          <h3 className="p-3 menu-title">Pedidos</h3>
        </div>
        <div className="px-3 d-flex flex-column">
          {items.length !== 0 ? (
            items.map((item) => (
              <div
                key={item.Pedido.PedidoID}
                className="pedido-item p-3 d-flex flex-column col mb-3"
              >
                <div className="d-flex flex-row align-items-center mb-3">
                  <h5 className="align-self-center m-0">
                    {item.Restaurante.Nome}
                  </h5>
                  <p className="align-self-center m-0 ms-auto">
                    {item.Pedido.DataHora}
                  </p>
                  <p className="align-self-center m-0 ms-auto">
                    Pedido {item.Pedido.PedidoID}
                  </p>
                </div>
                <div className="d-flex flex-column align-items-center mb-3">
                  <h6 className="me-auto m-0">Itens:</h6>
                  {item.Itens.map((i) => (
                    <div key={i.ItemPedido.ItemPedidoID} style={{ width: "100%" }}>
                      <div className="d-flex flex-row align-items-center gap-3">
                        <p className="me-auto m-0">{i.Prato.Nome}</p>
                        <p className="m-auto m-0">
                          obs: {i.ItemPedido.Observacao}
                        </p>
                        <p className="ms-auto m-0">
                          {i.ItemPedido.Quantidade}x
                        </p>
                      </div>
                      <hr className="m-0" style={{ width: "100%" }}></hr>
                    </div>
                  ))}
                </div>
                <h6 className="m-0">Endereço:</h6>
                <div className="d-flex flex-row align-items-center">
                  <p className="m-0">{item.Endereco.Bairro}</p>
                  <p className="ms-auto m-0">{item.Endereco.Rua}</p>
                  <p className="ms-auto m-0">{item.Endereco.Numero}</p>
                  <p className="ms-auto m-0">{item.Endereco.CEP}</p>
                </div>
                <hr className="m-0" style={{ width: "100%" }}></hr>
                <div className="d-flex flex-row align-items-center mt-3">
                  <p className="item-price">
                    R$ {item.Pedido.Total.toFixed(2)}
                  </p>
                  <p className="item-status ms-auto">
                    Status:
                    {item.Pedido.StatusPedido === "Pendente" && (
                      <span className="color-vermelho-escuro"> Pendente</span>
                    )}
                    {item.Pedido.StatusPedido === "Aceito" && (
                      <span className="color-verde-escuro"> Aceito</span>
                    )}
                    {item.Pedido.StatusPedido === "Saiu para entrega" && (
                      <span className="color-azul"> Saiu para Entrega</span>
                    )}
                    {item.Pedido.StatusPedido === "Entregue" && (
                      <span className="color-amarelo"> Entregue</span>
                    )}
                    {item.Pedido.StatusPedido === "Cancelado" && (
                      <span className="color-vermelho-escuro"> Cancelado</span>
                    )}
                    {item.Pedido.StatusPedido === "Avaliado" && (
                      <span className="color-verde-escuro"> Avaliado</span>
                    )}
                  </p>
                </div>
                <div className="d-flex flex-row align-items-center gap-3">
                  {item.Pedido.StatusPedido === "Pendente" && (
                    <button
                      className="red-button p-2"
                      onClick={() => handleCancelarPedido(item.Pedido.PedidoID)}
                    >
                      Cancelar Pedido
                    </button>
                  )}
                  {item.Pedido.StatusPedido === "Saiu para entrega" && (
                    <button
                      className="red-button p-2"
                      onClick={() =>
                        handleConfirmarEntrega(item.Pedido.PedidoID)
                      }
                    >
                      Confirmar Entrega
                    </button>
                  )}
                  {item.Pedido.StatusPedido === "Entregue" && (
                    <button
                      className="red-button p-2"
                      onClick={() => handleAvaliarPedido(item)}
                    >
                      Avaliar Pedido
                    </button>
                  )}
                  {item.Pedido.StatusPedido === "Avaliado" && item.Avaliacao && (
                    <div className="d-flex flex-column">
                      <h6 className="m-0">Avaliação: {item.Avaliacao.Nota}</h6>
                      <h6 className="m-0">
                        Feedback: {item.Avaliacao.Feedback}
                      </h6>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="d-flex flex-column align-items-center justify-content-center no-select">
              <h4 className="bold">Nenhum pedido encontrado</h4>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default PedidosCliente;