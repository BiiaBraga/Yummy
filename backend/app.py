from flask import Flask, jsonify, request
from connector import connect
from format import (
    formataPrato, formataPedido, formataItemPedido,
    formataEndereco, formataRestaurante, formataCliente,
    formataUsuario, formataAvaliacao, formataHorario
)
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}}, supports_credentials=True)

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
        return jsonify({"Erro": str(e)}), 500
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

# ---------------------- LISTAR ITENS RESTAURANTE ----------------------
@app.route('/listarItensRestaurante', methods=['GET'])
def listarItensRestaurante():
    restauranteID = request.args.get('restauranteID')
    conn = connect()
    cursor = conn.cursor()

    if restauranteID:
        cursor.execute("SELECT * FROM Prato WHERE RestauranteID = %s", (restauranteID,))
        itens = [formataPrato(p) for p in cursor.fetchall()]
    else:
        cursor.execute("SELECT * FROM Prato WHERE Disponibilidade = 1")
        itens = [formataPrato(p) for p in cursor.fetchall()]

    return jsonify(itens), 200

# ---------------------- LISTAR ITENS POR PESQUISA ----------------------
@app.route('/listarItensPesquisa', methods=['GET'])
def listarItensPesquisa():
    pesquisa = request.args.get('pesquisa')
    conn = connect()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM Prato WHERE Nome LIKE %s", ('%' + pesquisa + '%',))
    itens = [formataPrato(p) for p in cursor.fetchall()]
    return jsonify(itens), 200

# ---------------------- VERIFICAR DISPONIBILIDADE ----------------------
@app.route('/verificarDisponibilidade', methods=['POST'])
def verificarDisponibilidade():
    data = request.json
    itens = data['itens']
    conn = connect()
    cursor = conn.cursor()

    disponibilidade = []
    for item in itens:
        cursor.execute("SELECT * FROM Prato WHERE PratoID = %s", (item['PratoID'],))
        prato = cursor.fetchone()
        disponibilidade.append({
            "Item": item,
            "Disponibilidade": prato[5] if prato else 0
        })

    return jsonify(disponibilidade), 200

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
    conn = connect()
    cursor = conn.cursor()
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
            cursor.execute("SELECT * FROM Prato WHERE PratoID = %s", (item['PratoID'],))
            prato = formataPrato(cursor.fetchone())
            itensFormatados.append({"ItemPedido": item, "Prato": prato})

        pedidoCompleto.append({"Pedido": pedido, "Itens": itensFormatados, "Endereco": endereco,
                               "Restaurante": restaurante, "Avaliacao": avaliacao})

    return jsonify(pedidoCompleto), 200

# ---------------------- LISTAR PEDIDOS RESTAURANTE ----------------------
@app.route('/listarPedidosRestaurante', methods=['GET'])
def listarPedidosRestaurante():
    restauranteID = request.args.get('restauranteID')
    conn = connect()
    cursor = conn.cursor()
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
            cursor.execute("SELECT * FROM Prato WHERE PratoID = %s", (item['PratoID'],))
            prato = formataPrato(cursor.fetchone())
            itensFormatados.append({"ItemPedido": item, "Prato": prato})

        pedidoCompleto.append({"Pedido": pedido, "Itens": itensFormatados, "Endereco": endereco,
                               "Cliente": cliente, "Avaliacao": avaliacao})

    return jsonify(pedidoCompleto), 200

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
    return jsonify("OK"), 200

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
    data = request.json
    conn = connect()
    cursor = conn.cursor(dictionary=True)  # usa dictionary=True p/ pegar resultado como dict
    conn.start_transaction()
    try:
        # Pega o nome da categoria
        categoria_nome = data.get('categoriaNome')
        if not categoria_nome:
            return jsonify({"Erro": "Categoria é obrigatória"}), 400

        # Verifica se a categoria já existe
        cursor.execute("SELECT CategoriaID FROM CategoriasPratos WHERE NomeCategoria = %s", (categoria_nome,))
        row = cursor.fetchone()

        if row:
            categoriaID = row['CategoriaID']
        else:
            # Cria a categoria caso não exista
            cursor.execute("INSERT INTO CategoriasPratos (NomeCategoria) VALUES (%s)", (categoria_nome,))
            conn.commit()
            categoriaID = cursor.lastrowid

        # Agora insere o prato com o ID da categoria
        cursor.execute("""
            INSERT INTO Prato (RestauranteID, Nome, Descricao, Preco, Disponibilidade, Estoque, CategoriaID)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            data['restauranteID'], 
            data['nome'], 
            data['descricao'], 
            float(data['preco']), 
            True,
            int(data['estoque']), 
            categoriaID
        ))

        conn.commit()
        return jsonify({"success": True, "message": "Item Adicionado"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "error": str(e)}), 500
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
    data = request.json
    pratoID = request.args.get('pratoID')
    conn = connect()
    cursor = conn.cursor(dictionary=True)
    conn.start_transaction()

    try:
        categoria_nome = data.get('categoriaNome')
        
        # 🔹 Verifica se a categoria foi preenchida
        if not categoria_nome or categoria_nome.strip() == "":
            return jsonify({"success": False, "error": "Categoria é obrigatória"}), 400

        # 🔹 Verifica se a categoria já existe
        cursor.execute("SELECT CategoriaID FROM CategoriasPratos WHERE NomeCategoria = %s", (categoria_nome,))
        row = cursor.fetchone()
        if row:
            categoriaID = row['CategoriaID']
        else:
            # 🔹 Cria a categoria caso não exista
            cursor.execute("INSERT INTO CategoriasPratos (NomeCategoria) VALUES (%s)", (categoria_nome,))
            conn.commit()
            categoriaID = cursor.lastrowid

        # 🔹 Atualiza prato
        cursor.execute("""
            UPDATE Prato
            SET Nome = %s, Descricao = %s, Preco = %s, Estoque = %s, CategoriaID = %s
            WHERE PratoID = %s
        """, (
            data['nome'], data['descricao'], float(data['preco']),
            int(data['estoque']), categoriaID, pratoID
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
