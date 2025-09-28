import os
from werkzeug.utils import secure_filename
from flask import Flask, jsonify, request
from connector import connect
from format import (
    formataPrato, formataPedido, formataItemPedido,
    formataEndereco, formataRestaurante, formataCliente,
    formataUsuario, formataAvaliacao, formataHorario
)
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:*"}})

UPLOAD_FOLDER = 'static/uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ---------------------- TESTE DE CONEXÃO ----------------------
@app.route('/testAPI', methods=['GET'])
def testeAPI():
    conn = connect()
    if conn:
        return jsonify("Banco de Dados: Conectado")
    return jsonify("Banco de Dados: Não Conectado")

# ---------------------- LOGIN ----------------------
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    if 'login' not in data or 'senha' not in data:
        return jsonify("badRequest"), 400

    conn = connect()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM Usuario WHERE Login = %s AND Senha = %s", (data['login'], data['senha']))
    usuario = cursor.fetchone()

    if not usuario:
        return jsonify("notFound"), 404

    usuario = formataUsuario(usuario)
    userType = usuario["TipoUsuario"]

    if userType == "Cliente":
        cursor.execute("SELECT * FROM Cliente WHERE ClienteID = %s", (usuario["UserID"],))
        cliente = cursor.fetchone()
        return jsonify({
            "userType": "Cliente",
            "userID": cliente[0],
            "userName": cliente[2]  # Nome
        }), 200

    elif userType == "Restaurante":
        cursor.execute("SELECT * FROM Restaurante WHERE RestauranteID = %s", (usuario["UserID"],))
        restaurante = cursor.fetchone()
        return jsonify({
            "userType": "Restaurante",
            "userID": restaurante[0],
            "userName": restaurante[3]  # Nome
        }), 200

    return jsonify("internalServerError"), 500

# ---------------------- CADASTRO ----------------------
@app.route('/cadastro', methods=['POST'])
def cadastro():
    data = request.json
    print(f"Dados recebidos no cadastro: {data}")  # Adiciona log para depuração
    if not data or "userType" not in data:
        return jsonify("badRequest"), 400

    conn = connect()
    cursor = conn.cursor()
    conn.start_transaction()

    try:
        cursor.execute("INSERT INTO Usuario (Login, Senha, TipoUsuario) VALUES (%s, %s, %s)",
                       (data['email'], data['senha'], data['userType']))
        userID = cursor.lastrowid

        endereco = data['endereco']
        cursor.execute("INSERT INTO Endereco (UserID, Rua, Numero, Bairro, CEP) VALUES (%s, %s, %s, %s, %s)",
                       (userID, endereco['rua'], endereco['numero'], endereco['bairro'], endereco['cep']))

        if data['userType'] == "Cliente":
            cursor.execute("INSERT INTO Cliente (ClienteID, Telefone, Nome, CPF) VALUES (%s, %s, %s, %s)",
                           (userID, data['telefone'], data['nome'], data['cpf']))
        elif data['userType'] == "Restaurante":
            cursor.execute("INSERT INTO Restaurante (RestauranteID, Telefone, Culinaria, Nome, NotaMedia) VALUES (%s, %s, %s, %s, %s)",
                           (userID, data['telefone'], data['culinaria'], data['nome'], None))
            if "horarios" in data:
                for h in data['horarios']:
                    cursor.execute(
                        "INSERT INTO HorariosFuncionamento (RestauranteID, DiaSemana, HrAbertura, HrFechamento) VALUES (%s, %s, %s, %s)",
                        (userID, h["dia"], h["abertura"], h["fechamento"])
                    )

        conn.commit()
        return jsonify("cadastroOK"), 200
    except Exception as e:
        conn.rollback()
        # Verifica se o erro é devido a duplicação de nome
        if "duplicate key value violates unique constraint" in str(e) or "duplicate" in str(e).lower():
            return jsonify({"error": "Nome já existente, escolha outro"}), 400
        return jsonify({"error": "Erro interno do servidor"}), 500
    finally:
        cursor.close()
        conn.close()

# ---------------------- ATUALIZAR PERFIL ----------------------
@app.route('/atualizarPerfil', methods=['POST'])
def update():
    data = request.get_json()
    if not data or 'userID' not in data or 'userType' not in data:
        return jsonify("badRequest"), 400

    userID = data['userID']
    conn = connect()
    cursor = conn.cursor()
    conn.start_transaction()

    try:
        print(f"Dados recebidos: {data}")  # Depuração
        cursor.execute("UPDATE Usuario SET Login = %s WHERE UserID = %s", (data['email'], userID))
        endereco = data['endereco']
        cursor.execute("UPDATE Endereco SET Rua = %s, Numero = %s, Bairro = %s, CEP = %s WHERE UserID = %s",
                       (endereco['rua'], endereco['numero'], endereco['bairro'], endereco['cep'], userID))

        if data['userType'] == "Cliente":
            cursor.execute("UPDATE Cliente SET Nome = %s, Telefone = %s, CPF = %s WHERE ClienteID = %s",
                           (data['nome'], data['telefone'], data['cpf'], userID))
        elif data['userType'] == "Restaurante":
            cursor.execute("UPDATE Restaurante SET Nome = %s, Telefone = %s, Culinaria = %s WHERE RestauranteID = %s",
                           (data['nome'], data['telefone'], data['culinaria'], userID))
            # Atualiza horários: remove todos e insere os novos apenas se houver horários
            cursor.execute("DELETE FROM HorariosFuncionamento WHERE RestauranteID = %s", (userID,))
            if "horarios" in data and data['horarios']:
                for h in data['horarios']:
                    if not all(k in h for k in ['DiaSemana', 'HrAbertura', 'HrFechamento']):
                        raise ValueError("Horário incompleto: faltam campos 'DiaSemana', 'HrAbertura' ou 'HrFechamento'")
                    cursor.execute(
                        "INSERT INTO HorariosFuncionamento (RestauranteID, DiaSemana, HrAbertura, HrFechamento) VALUES (%s, %s, %s, %s)",
                        (userID, h["DiaSemana"], h["HrAbertura"], h["HrFechamento"])
                    )

        conn.commit()
        print(f"Atualização concluída para userID {userID}")
        return jsonify("updateOK"), 200
    except Exception as e:
        conn.rollback()
        print(f"Erro ao atualizar perfil: {str(e)}")  # Depuração
        return jsonify({"Erro": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ---------------------- EXCLUIR PERFIL ----------------------
@app.route('/excluirConta', methods=['DELETE', 'OPTIONS'])
def excluir_conta():
    if request.method == 'OPTIONS':
        return jsonify({}), 200  # Responde ao preflight com 200 OK

    data = request.json
    if not data or 'userID' not in data or 'userType' not in data:
        return jsonify({"error": "Dados inválidos"}), 400

    userID = data['userID']
    userType = data['userType']
    conn = connect()
    cursor = conn.cursor()
    conn.start_transaction()

    try:
        # Exclui horários (se for restaurante)
        if userType == "Restaurante":
            cursor.execute("DELETE FROM HorariosFuncionamento WHERE RestauranteID = %s", (userID,))
            cursor.execute("DELETE FROM Restaurante WHERE RestauranteID = %s", (userID,))

        # Exclui cliente (se for cliente)
        elif userType == "Cliente":
            cursor.execute("DELETE FROM Cliente WHERE ClienteID = %s", (userID,))

        # Exclui endereço
        cursor.execute("DELETE FROM Endereco WHERE UserID = %s", (userID,))
        # Exclui usuário
        cursor.execute("DELETE FROM Usuario WHERE UserID = %s", (userID,))

        conn.commit()
        return jsonify({"message": "Conta excluída com sucesso"}), 200
    except Exception as e:
        conn.rollback()
        print(f"Erro ao excluir conta: {str(e)}")
        return jsonify({"error": "Erro ao excluir conta"}), 500
    finally:
        cursor.close()
        conn.close()

# ---------------------- PERFIL ----------------------
@app.route('/perfil', methods=['GET'])
def perfil():
    userID = request.args.get('userID')
    userType = request.args.get('userType')
    if not userID or not userType:
        return jsonify("badRequest"), 400

    conn = connect()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM Usuario WHERE UserID = %s", (userID,))
    usuario = formataUsuario(cursor.fetchone())

    cursor.execute("SELECT * FROM Endereco WHERE UserID = %s", (userID,))
    endereco = formataEndereco(cursor.fetchone())

    if userType == "Cliente":
        cursor.execute("SELECT * FROM Cliente WHERE ClienteID = %s", (userID,))
        cliente = formataCliente(cursor.fetchone())
        return jsonify({"Usuario": usuario, "Endereco": endereco, "Cliente": cliente}), 200

    elif userType == "Restaurante":
        cursor.execute("SELECT * FROM Restaurante WHERE RestauranteID = %s", (userID,))
        restaurante = formataRestaurante(cursor.fetchone())
        cursor.execute("SELECT * FROM HorariosFuncionamento WHERE RestauranteID = %s", (userID,))
        horarios = [formataHorario(h) for h in cursor.fetchall()]
        
        cursor.execute("SELECT * FROM HorariosFuncionamento WHERE RestauranteID = %s", (userID,))
        horarios = [formataHorario(h) for h in cursor.fetchall()]
        print(f"Horários retornados para RestauranteID {userID}: {horarios}")  # Depuração
        
        return jsonify({"Usuario": usuario, "Endereco": endereco, "Restaurante": restaurante, "Horarios": horarios}), 200

    return jsonify("notFound"), 404

# ---------------------- LISTAR RESTAURANTES ----------------------
@app.route('/listarRestaurantes', methods=['GET'])
def listarRestaurantes():
    restauranteID = request.args.get('restauranteID')
    conn = connect()
    cursor = conn.cursor()

    if restauranteID:
        cursor.execute("SELECT * FROM Restaurante WHERE RestauranteID = %s", (restauranteID,))
        restaurante = formataRestaurante(cursor.fetchone())
        return jsonify(restaurante), 200
    else:
        cursor.execute("SELECT * FROM Restaurante")
        restaurantes = [formataRestaurante(r) for r in cursor.fetchall()]
        return jsonify(restaurantes), 200

# ---------------------- LISTAR ITENS RESTAURANTE (APENAS ABERTOS E DISPONÍVEIS) ----------------------
@app.route('/listarItensRestaurante', methods=['GET'])
def listarItensRestaurante():
    restauranteID = request.args.get('restauranteID')
    conn = connect()
    cursor = conn.cursor()
    try:
        if restauranteID:
            cursor.execute("""
                SELECT
                    p.PratoID, p.RestauranteID, p.Nome, p.Descricao, p.Preco, p.Disponibilidade, p.Estoque, p.CategoriaID, p.URL_Imagem, r.Nome AS NomeRestaurante, c.NomeCategoria
                FROM Prato p
                JOIN Restaurante r ON p.RestauranteID = r.RestauranteID
                JOIN CategoriasPratos c ON p.CategoriaID = c.CategoriaID
                WHERE p.RestauranteID = %s AND p.Disponibilidade = 1
            """, (restauranteID,))
        else:
            cursor.execute("""
                SELECT
                    p.PratoID, p.RestauranteID, p.Nome, p.Descricao, p.Preco, p.Disponibilidade, p.Estoque, p.CategoriaID, p.URL_Imagem, r.Nome AS NomeRestaurante, c.NomeCategoria
                FROM Prato p
                JOIN Restaurante r ON p.RestauranteID = r.RestauranteID
                JOIN CategoriasPratos c ON p.CategoriaID = c.CategoriaID
                WHERE p.Disponibilidade = 1
            """)

        pratos = cursor.fetchall()
        pratosFormatados = [formataPrato(prato) for prato in pratos]
        return jsonify(pratosFormatados), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ---------------------- LISTAR PRATOS RESTAURANTE (TODOS DISPONÍVEIS) ----------------------
@app.route('/listarPratosRestaurante', methods=['GET'])
def listarPratosRestaurante():
    restauranteID = request.args.get('restauranteID')
    conn = connect()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT
                p.PratoID, p.RestauranteID, p.Nome, p.Descricao, p.Preco, p.Disponibilidade, p.Estoque, p.CategoriaID, p.URL_Imagem, r.Nome AS NomeRestaurante, c.NomeCategoria
            FROM Prato p
            JOIN Restaurante r ON p.RestauranteID = r.RestauranteID
            JOIN CategoriasPratos c ON p.CategoriaID = c.CategoriaID
            WHERE p.RestauranteID = %s AND p.Disponibilidade = 1
        """, (restauranteID,))

        pratos = cursor.fetchall()
        pratosFormatados = [formataPrato(prato) for prato in pratos]
        return jsonify(pratosFormatados), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ---------------------- VERIFICAR HORÁRIO RESTAURANTE ----------------------
@app.route('/verificarHorarioRestaurante', methods=['GET'])
def verificarHorarioRestaurante():
    restauranteID = request.args.get('restauranteID')
    if not restauranteID:
        return jsonify({"error": "RestauranteID é obrigatório"}), 400
    
    conn = connect()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SET lc_time_names = 'pt_BR'")  # Define nomes de dias em português
        query = """
            SELECT COUNT(*) AS aberto
            FROM HorariosFuncionamento
            WHERE RestauranteID = %s
            AND DiaSemana = DAYNAME(CURDATE())
            AND CURRENT_TIME BETWEEN TIME(HrAbertura) AND TIME(HrFechamento)
        """
        cursor.execute(query, (restauranteID,))
        result = cursor.fetchone()
        return jsonify({"aberto": result['aberto'] > 0}), 200
    except Exception as e:
        print(f"Erro ao verificar horário: {str(e)}")
        return jsonify({"error": "Erro ao verificar horário"}), 500
    finally:
        cursor.close()
        conn.close()

# ---------------------- LISTAR ITENS POR PESQUISA (APENAS DISPONÍVEIS) ----------------------
@app.route('/listarItensPesquisa', methods=['GET'])
def listarItensPesquisa():
    pesquisa = request.args.get('pesquisa')
    restauranteID = request.args.get('restauranteID')
    conn = connect()
    cursor = conn.cursor()
    try:
        query = """
            SELECT
                p.PratoID, p.RestauranteID, p.Nome, p.Descricao, p.Preco, p.Disponibilidade, p.Estoque, p.CategoriaID, p.URL_Imagem, r.Nome AS NomeRestaurante, c.NomeCategoria
            FROM Prato p
            JOIN Restaurante r ON p.RestauranteID = r.RestauranteID
            JOIN CategoriasPratos c ON p.CategoriaID = c.CategoriaID
            WHERE (p.Nome LIKE %s OR p.Descricao LIKE %s OR c.NomeCategoria LIKE %s) AND p.Disponibilidade = 1
        """
        params = (f"%{pesquisa}%", f"%{pesquisa}%", f"%{pesquisa}%")

        if restauranteID:
            query += " AND p.RestauranteID = %s"
            params += (restauranteID,)

        cursor.execute(query, params)
        pratos = cursor.fetchall()
        pratosFormatados = [formataPrato(prato) for prato in pratos]
        return jsonify(pratosFormatados), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ---------------------- VERIFICAR DISPONIBILIDADE ----------------------
@app.route('/verificarDisponibilidade', methods=['POST'])
def verificarDisponibilidade():
    data = request.json
    itens = data['itens']
    conn = connect()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SET lc_time_names = 'pt_BR'")  # Define nomes de dias em português
        disponibilidade = []
        for item in itens:
            cursor.execute("SELECT * FROM Prato WHERE PratoID = %s", (item['PratoID'],))
            prato = cursor.fetchone()
            cursor.execute("""
                SELECT COUNT(*) AS aberto
                FROM HorariosFuncionamento
                WHERE RestauranteID = %s
                AND DiaSemana = DAYNAME(CURDATE())
                AND CURRENT_TIME BETWEEN TIME(HrAbertura) AND TIME(HrFechamento)
            """, (item['RestauranteID'],))
            aberto = cursor.fetchone()['aberto'] > 0
            disponibilidade.append({
                "Item": item,
                "Disponibilidade": prato['Disponibilidade'] if prato else 0,
                "RestauranteAberto": aberto
            })
        return jsonify(disponibilidade), 200
    except Exception as e:
        print(f"Erro ao verificar disponibilidade: {str(e)}")
        return jsonify({"error": "Erro ao verificar disponibilidade"}), 500
    finally:
        cursor.close()
        conn.close()

# ---------------------- FINALIZAR PEDIDO ----------------------
@app.route('/pedido', methods=['POST'])
def finalizarPedido():
    data = request.json
    conn = connect()
    cursor = conn.cursor()
    conn.start_transaction()

    try:
        cursor.execute("SELECT * FROM Endereco WHERE UserID = %s", (data['clienteID'],))
        endereco = cursor.fetchone()
        if not endereco:
            return jsonify("Endereço não encontrado"), 200

        enderecoID = endereco[0]
        cursor.execute("""INSERT INTO Pedido (ClienteID, RestauranteID, EnderecoID, DataHora, FormaPag, StatusPedido, Total)
                          VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                       (data['clienteID'], data['itens'][0]['RestauranteID'], enderecoID,
                        data['dataHora'], data['pagamento'], "Pendente", 0))
        pedidoID = cursor.lastrowid

        total = 0
        for item in data['itens']:
            cursor.execute("INSERT INTO ItemPedido (PedidoID, PratoID, Quantidade, Observacao) VALUES (%s, %s, %s, %s)",
                           (pedidoID, item['PratoID'], item['Quantidade'], item['Observacao']))
            total += item['Preco'] * item['Quantidade']

        cursor.execute("UPDATE Pedido SET Total = %s WHERE PedidoID = %s", (total, pedidoID))
        conn.commit()
        return jsonify("Pedido Realizado"), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"Erro": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ---------------------- LISTAR PEDIDOS CLIENTE ----------------------
@app.route('/listarPedidosCliente', methods=['GET'])
def listarPedidosCliente():
    clienteID = request.args.get('clienteID')
    if not clienteID:
        return jsonify({"error": "clienteID é obrigatório"}), 400

    conn = connect()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM Pedido WHERE ClienteID = %s ORDER BY DataHora DESC", (clienteID,))
        pedidos = [formataPedido(p) for p in cursor.fetchall()]

        pedidoCompleto = []
        for pedido in pedidos:
            cursor.execute("SELECT * FROM ItemPedido WHERE PedidoID = %s", (pedido['PedidoID'],))
            itensPedidos = [formataItemPedido(i) for i in cursor.fetchall()]
            cursor.execute("SELECT * FROM Endereco WHERE EnderecoID = %s", (pedido['EnderecoID'],))
            endereco = formataEndereco(cursor.fetchone())
            cursor.execute("SELECT * FROM Restaurante WHERE RestauranteID = %s", (pedido['RestauranteID'],))
            restaurante = formataRestaurante(cursor.fetchone())
            cursor.execute("SELECT * FROM Avaliacao WHERE PedidoID = %s", (pedido['PedidoID'],))
            avaliacao = cursor.fetchone()
            avaliacao = formataAvaliacao(avaliacao) if avaliacao else None

            itensFormatados = []
            for item in itensPedidos:
                cursor.execute("""
                    SELECT
                        p.PratoID, p.RestauranteID, p.Nome, p.Descricao, p.Preco, p.Disponibilidade, p.Estoque, p.CategoriaID, p.URL_Imagem,
                        r.Nome AS NomeRestaurante, c.NomeCategoria
                    FROM Prato p
                    JOIN Restaurante r ON p.RestauranteID = r.RestauranteID
                    JOIN CategoriasPratos c ON p.CategoriaID = c.CategoriaID
                    WHERE p.PratoID = %s
                """, (item['PratoID'],))
                prato = formataPrato(cursor.fetchone())
                if prato:  # Verifica se o prato existe
                    itensFormatados.append({"ItemPedido": item, "Prato": prato})

            pedidoCompleto.append({
                "Pedido": pedido,
                "Itens": itensFormatados,
                "Endereco": endereco,
                "Restaurante": restaurante,
                "Avaliacao": avaliacao
            })

        return jsonify(pedidoCompleto), 200
    except Exception as e:
        print(f"Erro ao listar pedidos: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ---------------------- LISTAR PEDIDOS RESTAURANTE ----------------------
@app.route('/listarPedidosRestaurante', methods=['GET'])
def listarPedidosRestaurante():
    restauranteID = request.args.get('restauranteID')
    if not restauranteID:
        return jsonify({"error": "restauranteID é obrigatório"}), 400

    conn = connect()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM Pedido WHERE RestauranteID = %s ORDER BY DataHora DESC", (restauranteID,))
        pedidos = [formataPedido(p) for p in cursor.fetchall()]

        pedidoCompleto = []
        for pedido in pedidos:
            cursor.execute("SELECT * FROM ItemPedido WHERE PedidoID = %s", (pedido['PedidoID'],))
            itensPedidos = [formataItemPedido(i) for i in cursor.fetchall()]
            cursor.execute("SELECT * FROM Endereco WHERE EnderecoID = %s", (pedido['EnderecoID'],))
            endereco = formataEndereco(cursor.fetchone())
            cursor.execute("SELECT * FROM Cliente WHERE ClienteID = %s", (pedido['ClienteID'],))
            cliente = formataCliente(cursor.fetchone())
            cursor.execute("SELECT * FROM Avaliacao WHERE PedidoID = %s", (pedido['PedidoID'],))
            avaliacao = cursor.fetchone()
            avaliacao = formataAvaliacao(avaliacao) if avaliacao else None

            itensFormatados = []
            for item in itensPedidos:
                cursor.execute("""
                    SELECT
                        p.PratoID, p.RestauranteID, p.Nome, p.Descricao, p.Preco, p.Disponibilidade, p.Estoque, p.CategoriaID, p.URL_Imagem,
                        r.Nome AS NomeRestaurante, c.NomeCategoria
                    FROM Prato p
                    JOIN Restaurante r ON p.RestauranteID = r.RestauranteID
                    JOIN CategoriasPratos c ON p.CategoriaID = c.CategoriaID
                    WHERE p.PratoID = %s
                """, (item['PratoID'],))
                prato = cursor.fetchone()
                prato = formataPrato(prato) if prato else None
                if prato:  # Verifica se o prato existe
                    itensFormatados.append({"ItemPedido": item, "Prato": prato})

            pedidoCompleto.append({
                "Pedido": pedido,
                "Itens": itensFormatados,
                "Endereco": endereco,
                "Cliente": cliente,
                "Avaliacao": avaliacao
            })

        return jsonify(pedidoCompleto), 200
    except Exception as e:
        print(f"Erro ao listar pedidos do restaurante: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ---------------------- LISTAR AVALIAÇÕES RESTAURANTE ----------------------
@app.route('/listarAvaliacoesRestaurante', methods=['GET'])
def listarAvaliacoesRestaurante():
    restauranteID = request.args.get('restauranteID')
    if not restauranteID:
        return jsonify({"error": "RestauranteID é obrigatório"}), 400
    
    conn = connect()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT a.PedidoID, a.RestauranteID, a.ClienteID, a.DataHora, a.Nota, a.Feedback, c.Nome AS NomeCliente
            FROM Avaliacao a
            JOIN Cliente c ON a.ClienteID = c.ClienteID
            WHERE a.RestauranteID = %s
            ORDER BY a.DataHora DESC
        """, (restauranteID,))
        avaliacoes = cursor.fetchall()
        avaliacoesFormatadas = [
            {
                **formataAvaliacao(avaliacao),  # Usa formataAvaliacao para as colunas padrão
                "NomeCliente": avaliacao[6]  # Adiciona NomeCliente ao resultado
            }
            for avaliacao in avaliacoes
        ]
        return jsonify(avaliacoesFormatadas), 200
    except Exception as e:
        print(f"Erro ao listar avaliações: {str(e)}")
        return jsonify({"error": "Erro ao listar avaliações"}), 500
    finally:
        cursor.close()
        conn.close()

# ---------------------- ALTERAR STATUS PEDIDOS ----------------------
@app.route('/pedidoEntregue', methods=['GET'])
def pedidoEntregue():
    pedidoID = request.args.get('pedidoID')
    conn = connect()
    cursor = conn.cursor()
    cursor.execute("UPDATE Pedido SET StatusPedido = %s WHERE PedidoID = %s", ("Entregue", pedidoID))
    conn.commit()
    return jsonify("OK"), 200

@app.route('/confirmarEntrega', methods=['GET'])
def confirmarEntrega():
    pedidoID = request.args.get('pedidoID')
    conn = connect()
    cursor = conn.cursor()
    cursor.execute("UPDATE Pedido SET StatusPedido = %s WHERE PedidoID = %s", ("Entregue", pedidoID))
    conn.commit()
    return jsonify("OK"), 200

@app.route('/aceitarPedido', methods=['GET'])
def aceitarPedido():
    pedidoID = request.args.get('pedidoID')
    conn = connect()
    cursor = conn.cursor()
    cursor.execute("UPDATE Pedido SET StatusPedido = %s WHERE PedidoID = %s", ("Aceito", pedidoID))
    conn.commit()
    return jsonify("OK"), 200

@app.route('/cancelarPedido', methods=['GET'])
def cancelarPedido():
    pedidoID = request.args.get('pedidoID')
    conn = connect()
    cursor = conn.cursor()
    cursor.execute("UPDATE Pedido SET StatusPedido = %s WHERE PedidoID = %s", ("Cancelado", pedidoID))
    conn.commit()
    return jsonify({"message": "Pedido cancelado e estoque revertido (se pendente)"}), 200

@app.route('/saiuEntrega', methods=['GET'])
def saiuEntrega():
    pedidoID = request.args.get('pedidoID')
    conn = connect()
    cursor = conn.cursor()
    cursor.execute("UPDATE Pedido SET StatusPedido = %s WHERE PedidoID = %s", ("Saiu para entrega", pedidoID))
    conn.commit()
    return jsonify("OK"), 200

# ---------------------- CARDÁPIO ----------------------
@app.route('/adicionarItemCardapio', methods=['POST'])
def adicionarItemCardapio():
    # Mude para request.form para os dados de texto e request.files para a imagem
    print(f"Dados de formulário recebidos: {request.form}") # Log para depuração
    print(f"Arquivos recebidos: {request.files}") # Log para depuração

    conn = connect()
    cursor = conn.cursor(dictionary=True)
    conn.start_transaction()
    
    try:
        nome = request.form.get('nome')
        descricao = request.form.get('descricao')
        preco = request.form.get('preco')
        estoque = request.form.get('estoque')
        categoria_nome = request.form.get('categoriaNome')
        restauranteID = request.form.get('restauranteID')
        imagem_file = request.files.get('imagem')

        if not all([nome, descricao, preco, estoque, categoria_nome, restauranteID]):
            return jsonify({"error": "Preencha todos os campos obrigatórios"}), 400

        # Verifica ou insere a categoria
        cursor.execute("SELECT CategoriaID FROM CategoriasPratos WHERE NomeCategoria = %s", (categoria_nome,))
        row = cursor.fetchone()
        if row:
            categoriaID = row['CategoriaID']
        else:
            cursor.execute("INSERT INTO CategoriasPratos (NomeCategoria) VALUES (%s)", (categoria_nome,))
            categoriaID = cursor.lastrowid

        # Salva a imagem no servidor
        url_imagem = None
        if imagem_file:
            # Defina o caminho para a pasta de upload
            UPLOAD_FOLDER = 'static/uploads'
            if not os.path.exists(UPLOAD_FOLDER):
                os.makedirs(UPLOAD_FOLDER)
            
            # Gera um nome de arquivo seguro e salva a imagem
            filename = secure_filename(imagem_file.filename)
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            imagem_file.save(filepath)
            
            # Constrói a URL para o front-end
            url_imagem = f'/{filepath}'
            print(f"Imagem salva em: {url_imagem}") # Log

        # Insere os dados do prato no banco de dados, incluindo a URL da imagem
        cursor.execute("""
            INSERT INTO Prato (RestauranteID, Nome, Descricao, Preco, Disponibilidade, Estoque, CategoriaID, URL_Imagem)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            restauranteID,
            nome,
            descricao,
            float(preco),
            True,
            int(estoque),
            categoriaID,
            url_imagem  # AQUI está a URL da imagem que você salvou
        ))

        conn.commit()
        print(f"Item adicionado com sucesso: PratoID={cursor.lastrowid}")
        return jsonify({"success": True, "message": "Item Adicionado"}), 200
    except Exception as e:
        conn.rollback()
        print(f"Erro ao adicionar item: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/listarCategorias', methods=['GET'])
def listar_categorias():
    conn = connect()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM CategoriasPratos")
    categorias = [dict(CategoriaID=row[0], NomeCategoria=row[1]) for row in cursor.fetchall()]
    cursor.close()
    conn.close()
    return jsonify(categorias), 200

@app.route('/editarItemCardapio', methods=['POST'])
def editarItemCardapio():
    pratoID = request.args.get('pratoID')
    conn = connect()
    cursor = conn.cursor()
    conn.start_transaction()

    try:
        # Lê os dados dos campos de texto (FormData)
        nome = request.form['nome']
        descricao = request.form['descricao']
        preco = float(request.form['preco'])
        estoque = int(request.form['estoque'])
        categoria_nome = request.form['categoriaNome']
        
        # Lógica para a imagem
        imagem_path = None
        # Verifica se um arquivo de imagem foi enviado na requisição
        if 'imagem' in request.files:
            file = request.files['imagem']
            # Garante que o arquivo existe e que o nome do arquivo não está vazio
            if file and file.filename != '' and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                
                # Salva a imagem na pasta 'static/uploads'
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(file_path)
                
                # Cria a URL que será salva no banco de dados
                imagem_path = f"/static/uploads/{filename}"

        # Verifica se a categoria existe ou a cria
        cursor.execute("SELECT CategoriaID FROM CategoriasPratos WHERE NomeCategoria = %s", (categoria_nome,))
        row = cursor.fetchone()
        if row:
            categoriaID = row[0]
        else:
            cursor.execute("INSERT INTO CategoriasPratos (NomeCategoria) VALUES (%s)", (categoria_nome,))
            conn.commit()
            categoriaID = cursor.lastrowid
        
        # Atualiza o prato
        if imagem_path:
            # Se uma nova imagem foi enviada, atualiza também a URL
            cursor.execute("""
                UPDATE Prato
                SET Nome = %s, Descricao = %s, Preco = %s, Estoque = %s, CategoriaID = %s, URL_Imagem = %s
                WHERE PratoID = %s
            """, (
                nome, descricao, preco, estoque, categoriaID, imagem_path, pratoID
            ))
        else:
            # Se nenhuma imagem foi enviada, atualiza apenas os outros campos
            cursor.execute("""
                UPDATE Prato
                SET Nome = %s, Descricao = %s, Preco = %s, Estoque = %s, CategoriaID = %s
                WHERE PratoID = %s
            """, (
                nome, descricao, preco, estoque, categoriaID, pratoID
            ))

        conn.commit()
        return jsonify({"success": True, "message": "Prato atualizado com sucesso"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/removerItemCardapio', methods=['DELETE'])
def removerItemCardapio():
    pratoID = request.args.get('pratoID')
    conn = connect()
    cursor = conn.cursor()
    conn.start_transaction()

    try:
        cursor.execute("DELETE FROM Prato WHERE PratoID = %s", (pratoID,))
        conn.commit()
        return jsonify({"success": True, "message": "Prato removido com sucesso"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/trocarDisponibilidade', methods=['GET'])
def trocarDisponibilidade():
    pratoID = request.args.get('pratoID')
    conn = connect()
    cursor = conn.cursor()
    cursor.execute("SELECT Disponibilidade FROM Prato WHERE PratoID = %s", (pratoID,))
    disponibilidade = cursor.fetchone()
    nova = 1 if disponibilidade[0] == 0 else 0
    cursor.execute("UPDATE Prato SET Disponibilidade = %s WHERE PratoID = %s", (nova, pratoID))
    conn.commit()
    return jsonify("OK"), 200

# ---------------------- AVALIAÇÃO ----------------------
@app.route('/avaliarPedido', methods=['POST'])
def avaliarPedido():
    data = request.json
    pedido = data['pedido']
    conn = connect()
    cursor = conn.cursor()
    cursor.execute("""INSERT INTO Avaliacao (PedidoID, RestauranteID, ClienteID, DataHora, Nota, Feedback)
                      VALUES (%s, %s, %s, %s, %s, %s)""",
                   (pedido['Pedido']['PedidoID'], pedido['Pedido']['RestauranteID'], pedido['Pedido']['ClienteID'],
                    data['dataHora'], data['avaliacao'], data['comentario']))
    conn.commit()
    return jsonify("OK"), 200


# ---------------------- MAIN ----------------------
if __name__ == '__main__':
    app.run(debug=True)