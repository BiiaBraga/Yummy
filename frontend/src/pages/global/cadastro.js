import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Cadastro() {
  const apiRoot = process.env.REACT_APP_API_URL;
  const navigate = useNavigate();

  const [inputNome, setInputNome] = useState('');
  const [inputEmail, setInputEmail] = useState('');
  const [inputSenha, setInputSenha] = useState('');
  const [inputCpf, setInputCpf] = useState('');
  const [inputTelefone, setInputTelefone] = useState('');
  const [inputCulinaria, setInputCulinaria] = useState('');
  const [userTypeLocal, setUserTypeLocal] = useState('Cliente'); // cliente ou restaurante
  const [inputEndereco, setInputEndereco] = useState({
    rua: '',
    numero: '',
    bairro: '',
    cep: '',
  });

  // lista de horários (só p/ restaurante)
  const [inputHorarios, setInputHorarios] = useState([
    { dia: '', abertura: '', fechamento: '' }
  ]);

  const handleAddHorario = () => {
    setInputHorarios([...inputHorarios, { dia: '', abertura: '', fechamento: '' }]);
  };

  const handleChangeHorario = (index, field, value) => {
    const novos = [...inputHorarios];
    novos[index][field] = value;
    setInputHorarios(novos);
  };

  const handleCadastro = async () => {
    if (!inputNome || !inputEmail || !inputSenha || !userTypeLocal || !inputTelefone ||
        !inputEndereco.rua || !inputEndereco.numero || !inputEndereco.bairro || !inputEndereco.cep) {
      alert("Preencha todos os campos!");
      return;
    }

    if (userTypeLocal === 'Cliente' && !inputCpf) {
      alert("Preencha todos os campos!");
      return;
    } else if (userTypeLocal === 'Restaurante' && (!inputCulinaria || inputHorarios.length === 0)) {
      alert("Preencha todos os campos!");
      return;
    }

    const dataToSend = {
      nome: inputNome,
      email: inputEmail,
      senha: inputSenha,
      userType: userTypeLocal,
      telefone: inputTelefone,
      endereco: inputEndereco,
      ...(userTypeLocal === 'Cliente'
        ? { cpf: inputCpf }
        : { culinaria: inputCulinaria, horarios: inputHorarios }
      ),
    };

    try {
      const response = await fetch(`${apiRoot}/cadastro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();  // Lê o corpo da resposta de erro
        const errorMessage = errorData.error || "Erro ao cadastrar usuário!";  // Usa a mensagem do backend
        alert(errorMessage);  // Exibe a mensagem específica
        return;
      }

      const data = await response.json();

      if (data === "emailExists") {
        alert("Email já cadastrado!");
      } else if (data === "cpfExists") {
        alert("CPF já cadastrado!");
      } else if (data === "nomeExists") {
        alert("Nome de restaurante já cadastrado!");
      } else if (data === "cadastroOK") {
        alert("Cadastro realizado com sucesso!");
        navigate("/login");
      } else {
        alert("Erro ao cadastrar usuário!");
      }

    } catch (error) {
      console.log(error);
      alert("Erro ao conectar com o servidor!");
    }
  };

  return (
    <div className="screen d-flex flex-column align-items-center justify-content-center no-select">
      <div className="background"></div>
      <div className="card col-10 d-flex flex-column align-items-center justify-content-center mt-4 mb-4 p-4" style={{maxWidth: "43rem"}}>
        <h4 className="card-title my-4">Crie sua conta!</h4>

        {/* nome/email/senha/tipo */}
        <div className="col-12">
          <div className="row d-flex flex-wrap">
            <div className="mb-2 d-flex flex-column col">
              <h6 className="card-text">Nome</h6>
              <input type="text" className="card-input p-2" value={inputNome} onChange={(e) => setInputNome(e.target.value)}/>
            </div>
            <div className="mb-2 d-flex flex-column col">
              <h6 className="card-text">Email</h6>
              <input type="email" className="card-input p-2" value={inputEmail} onChange={(e) => setInputEmail(e.target.value)}/>
            </div>
          </div>

          <div className="row d-flex flex-wrap">
            <div className="mb-2 d-flex flex-column col">
              <h6 className="card-text">Senha</h6>
              <input type="password" className="card-input p-2" value={inputSenha} onChange={(e) => setInputSenha(e.target.value)}/>
            </div>
            <div className="mb-3 d-flex flex-column col">
              <h6 className="card-text">Tipo de Conta</h6>
              <select className="card-select p-2" value={userTypeLocal} onChange={(e) => setUserTypeLocal(e.target.value)}>
                <option value="Cliente">Cliente</option>
                <option value="Restaurante">Restaurante</option>
              </select>
            </div>
          </div>
        </div>

        {/* Cliente */}
        {userTypeLocal === 'Cliente' && (
          <div className="col-12">
            <div className="row d-flex flex-wrap">
              <div className="mb-2 col">
                <h6>CPF</h6>
                <input type="text" className="card-input p-2" value={inputCpf} onChange={(e) => setInputCpf(e.target.value)}/>
              </div>
              <div className="mb-2 col">
                <h6>Telefone</h6>
                <input type="text" className="card-input p-2" value={inputTelefone} onChange={(e) => setInputTelefone(e.target.value)}/>
              </div>
            </div>
          </div>
        )}

        {/* Restaurante */}
        {userTypeLocal === 'Restaurante' && (
          <div className="col-12">
            <div className="row">
              <div className="mb-2 col">
                <h6>Culinária</h6>
                <input type="text" className="card-input p-2" value={inputCulinaria} onChange={(e) => setInputCulinaria(e.target.value)}/>
              </div>
              <div className="mb-2 col">
                <h6>Telefone</h6>
                <input type="text" className="card-input p-2" value={inputTelefone} onChange={(e) => setInputTelefone(e.target.value)}/>
              </div>
            </div>

            <h6 className="card-subtitle my-3 text-center">Horários de Funcionamento</h6>
            {inputHorarios.map((h, index) => (
              <div key={index} className="row mb-2">
                <input type="text" placeholder="Dia" className="card-input col m-1 p-2"
                  value={h.dia} onChange={(e) => handleChangeHorario(index, "dia", e.target.value)} />
                <input type="time" className="card-input col m-1 p-2"
                  value={h.abertura} onChange={(e) => handleChangeHorario(index, "abertura", e.target.value)} />
                <input type="time" className="card-input col m-1 p-2"
                  value={h.fechamento} onChange={(e) => handleChangeHorario(index, "fechamento", e.target.value)} />
              </div>
            ))}
            <button className="white-button p-2 mb-3" onClick={handleAddHorario}>+ Adicionar horário</button>
          </div>
        )}

        {/* Endereço */}
        <h6 className="card-subtitle my-3 text-center">Endereço</h6>
        <div className="row">
          <div className="col"><input type="text" placeholder="Rua" className="card-input p-2 mb-2" value={inputEndereco.rua} onChange={(e) => setInputEndereco({...inputEndereco, rua: e.target.value})}/></div>
          <div className="col"><input type="text" placeholder="Número" className="card-input p-2 mb-2" value={inputEndereco.numero} onChange={(e) => setInputEndereco({...inputEndereco, numero: e.target.value})}/></div>
        </div>
        <div className="row">
          <div className="col"><input type="text" placeholder="Bairro" className="card-input p-2 mb-2" value={inputEndereco.bairro} onChange={(e) => setInputEndereco({...inputEndereco, bairro: e.target.value})}/></div>
          <div className="col"><input type="text" placeholder="CEP" className="card-input p-2 mb-2" value={inputEndereco.cep} onChange={(e) => setInputEndereco({...inputEndereco, cep: e.target.value})}/></div>
        </div>

        <button className="red-button my-3 p-2 col-5" onClick={handleCadastro}>Cadastrar</button>
        <div className="card-link mb-4 bold" onClick={() => navigate("/")}>Voltar a Home</div>
      </div>
    </div>
  );
}

export default Cadastro;