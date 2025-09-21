import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/userContext";

function Perfil() {
  const navigate = useNavigate();
  const apiRoot = process.env.REACT_APP_API_URL;
  const { userType, userID, userName, setUserType, setUserID, setUserName } = useUser();
  const [showPerfilOptions, setShowPerfilOptions] = useState(false);

  const [inputNome, setInputNome] = useState("");
  const [inputEmail, setInputEmail] = useState("");
  const [inputCpf, setInputCpf] = useState("");
  const [inputTelefone, setInputTelefone] = useState("");
  const [inputEndereco, setInputEndereco] = useState({ rua: "", numero: "", bairro: "", cep: "" });
  const [inputCulinaria, setInputCulinaria] = useState("");
  const [inputHorarios, setInputHorarios] = useState([]);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false); // Novo estado para a modal

  const handleSairConta = () => {
    setUserType(null);
    setUserID(null);
    setUserName(null);
    navigate("/");
  };

  const handleAddHorario = () => {
    setInputHorarios([...inputHorarios, { DiaSemana: '', HrAbertura: '', HrFechamento: '' }]);
  };

  const handleChangeHorario = (index, field, value) => {
    const novos = [...inputHorarios];
    novos[index][field] = value;
    setInputHorarios(novos);
  };

  const fetchUserInfo = async () => {
    try {
      const response = await fetch(`${apiRoot}/perfil?userID=${userID}&userType=${userType}`);
      if (!response.ok) {
        alert("Erro ao carregar informações do perfil!");
        return;
      }

      const data = await response.json();
      console.log("Dados do perfil:", data);
      if (userType === "Cliente") {
        setInputNome(data.Cliente.Nome);
        setInputEmail(data.Usuario.Login);
        setInputCpf(data.Cliente.CPF);
        setInputTelefone(data.Cliente.Telefone);
        setInputEndereco({
          rua: data.Endereco.Rua,
          numero: data.Endereco.Numero,
          bairro: data.Endereco.Bairro,
          cep: data.Endereco.CEP,
        });
      } else if (userType === "Restaurante") {
        setInputNome(data.Restaurante.Nome);
        setInputEmail(data.Usuario.Login);
        setInputCulinaria(data.Restaurante.Culinaria);
        setInputTelefone(data.Restaurante.Telefone);
        setInputHorarios(data.Horarios.map(h => ({
          DiaSemana: h.DiaSemana || '',
          HrAbertura: h.HrAbertura || '',
          HrFechamento: h.HrFechamento || ''
        }))); // Garante que todos os horários sejam carregados
        console.log("Horários carregados:", data.Horarios);
        setInputEndereco({
          rua: data.Endereco.Rua,
          numero: data.Endereco.Numero,
          bairro: data.Endereco.Bairro,
          cep: data.Endereco.CEP,
        });
      }
    } catch (error) {
      console.log(error);
      alert("Erro ao conectar com o servidor!");
    }
  };

  const handleAtualizarPerfil = async () => {
    const dataToSend = {
      nome: inputNome,
      email: inputEmail,
      userID,
      userType,
      telefone: inputTelefone,
      endereco: inputEndereco,
      ...(userType === 'Cliente'
        ? { cpf: inputCpf }
        : { culinaria: inputCulinaria, horarios: inputHorarios.filter(h => h.DiaSemana || h.HrAbertura || h.HrFechamento) }),
    };

    try {
      const response = await fetch(`${apiRoot}/atualizarPerfil`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      const data = await response.json();
      if (data === "updateOK") {
        alert("Update realizado com sucesso!");
        setUserName(inputNome);
      } else {
        alert(`Erro ao atualizar perfil: ${data.Erro || "Tente novamente"}`);
      }
    } catch (error) {
      console.log(error);
      alert("Erro ao conectar com o servidor!");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const response = await fetch(`${apiRoot}/excluirConta`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userID, userType }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || "Erro ao excluir conta!");
        return;
      }

      alert("Conta excluída com sucesso!");
      setUserType(null);
      setUserID(null);
      setUserName(null);
      navigate("/");
    } catch (error) {
      console.log(error);
      alert("Erro ao conectar com o servidor!");
    }
  };

  useEffect(() => {
    if (!userType || !userID) navigate("/");
    fetchUserInfo();
    if (userType === "Restaurante" && inputHorarios.length === 0) {
      setInputHorarios([{ DiaSemana: '', HrAbertura: '', HrFechamento: '' }]);
    }
  }, []);

  return (
    <div className="screen d-flex flex-column align-items-center justify-content-center no-select">
      <div className="background"></div>

      <div className="card col-10 d-flex flex-column align-items-center justify-content-center p-4" style={{maxWidth: "43rem"}}>
        <h4 className="card-title my-4">Seu Perfil</h4>

        <div className="row">
          <div className="col">
            <h6>Nome</h6>
            <input type="text" className="card-input p-2" value={inputNome} onChange={(e) => setInputNome(e.target.value)}/>
          </div>
          <div className="col">
            <h6>Email</h6>
            <input type="email" className="card-input p-2" value={inputEmail} onChange={(e) => setInputEmail(e.target.value)}/>
          </div>
        </div>

        {userType === 'Cliente' && (
          <>
            <div className="row">
              <div className="col">
                <h6>CPF</h6>
                <input type="text" className="card-input p-2" value={inputCpf} onChange={(e) => setInputCpf(e.target.value)}/>
              </div>
              <div className="col">
                <h6>Telefone</h6>
                <input type="text" className="card-input p-2" value={inputTelefone} onChange={(e) => setInputTelefone(e.target.value)}/>
              </div>
            </div>
          </>
        )}

        {userType === 'Restaurante' && (
          <>
            <div className="row">
              <div className="col">
                <h6>Culinária</h6>
                <input type="text" className="card-input p-2" value={inputCulinaria} onChange={(e) => setInputCulinaria(e.target.value)}/>
              </div>
              <div className="col">
                <h6>Telefone</h6>
                <input type="text" className="card-input p-2" value={inputTelefone} onChange={(e) => setInputTelefone(e.target.value)}/>
              </div>
            </div>

            <h6 className="card-subtitle my-3 text-center">Horários de Funcionamento</h6>
            {inputHorarios.map((h, index) => (
              <div key={index} className="row mb-2">
                <input type="text" placeholder="Dia" className="card-input col m-1 p-2"
                  value={h.DiaSemana || ''} onChange={(e) => handleChangeHorario(index, "DiaSemana", e.target.value)} />
                <input type="time" className="card-input col m-1 p-2"
                  value={h.HrAbertura || ''} onChange={(e) => handleChangeHorario(index, "HrAbertura", e.target.value)} />
                <input type="time" className="card-input col m-1 p-2"
                  value={h.HrFechamento || ''} onChange={(e) => handleChangeHorario(index, "HrFechamento", e.target.value)} />
              </div>
            ))}
            <button className="white-button p-2 mb-3" onClick={handleAddHorario}>+ Adicionar horário</button>
          </>
        )}

        <h6 className="card-subtitle my-3 text-center">Endereço</h6>
        <div className="row">
          <div className="col"><input type="text" placeholder="Rua" className="card-input p-2 mb-2" value={inputEndereco.rua} onChange={(e) => setInputEndereco({...inputEndereco, rua: e.target.value})}/></div>
          <div className="col"><input type="text" placeholder="Número" className="card-input p-2 mb-2" value={inputEndereco.numero} onChange={(e) => setInputEndereco({...inputEndereco, numero: e.target.value})}/></div>
        </div>
        <div className="row">
          <div className="col"><input type="text" placeholder="Bairro" className="card-input p-2 mb-2" value={inputEndereco.bairro} onChange={(e) => setInputEndereco({...inputEndereco, bairro: e.target.value})}/></div>
          <div className="col"><input type="text" placeholder="CEP" className="card-input p-2 mb-2" value={inputEndereco.cep} onChange={(e) => setInputEndereco({...inputEndereco, cep: e.target.value})}/></div>
        </div>

        <button className="red-button my-3 p-2 col-5" onClick={handleAtualizarPerfil}>Atualizar</button>
        <button className="red-button my-3 p-2 col-5" onClick={() => setShowConfirmDelete(true)}>Excluir Conta</button>

        {/* Modal de Confirmação */}
        {showConfirmDelete && (
          <div className="modal" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className="modal-content" style={{ backgroundColor: 'white', padding: '20px', borderRadius: '5px', textAlign: 'center' }}>
              <h4>Tem certeza?</h4>
              <p>Essa ação excluirá sua conta permanentemente.</p>
              <button className="red-button p-2 m-2" onClick={handleDeleteAccount}>Sim</button>
              <button className="white-button p-2 m-2" onClick={() => setShowConfirmDelete(false)}>Não</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Perfil;