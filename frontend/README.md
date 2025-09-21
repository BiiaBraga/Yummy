# Yummy - Sistema de Delivery de Comida

Yummy é um aplicativo de delivery de comida com frontend em React e backend em Flask, projetado para facilitar pedidos de comida em restaurantes. Este projeto consiste em duas componentes principais: um backend (API baseada em Flask) e um frontend (interface de usuário baseada em React).

## Estrutura do Projeto

O projeto está organizado em duas pastas principais:

### Backend
- **`app.py`**: Arquivo principal da aplicação Flask que define rotas e lógica do servidor.
- **`connector.py`**: Gerencia conexões com o banco de dados (MySQL).
- **`format.py`**: Funções utilitárias para formatação de dados.
- **`init.sql`**: Script SQL para inicializar o esquema do banco de dados.
- **`static/`**: Pasta para arquivos estáticos servidos pelo backend (ex.: imagens, uploads).

### Frontend
- **`node_modules/`**: Contém dependências do Node.js (instaladas via npm).
- **`public/`**: Ativos estáticos como imagens usadas no frontend.
- **`src/`**: Código fonte da aplicação React.
  - **`context/`**:
    - `cartContext.js`: Gerencia o estado do carrinho de compras.
    - `userContext.js`: Gerencia o estado de autenticação do usuário.
  - **`pages/`**:
    - **`cliente/`**:
      - `avaliarPedido.js`: Componente para avaliar pedidos.
      - `finalizaPedido.js`: Componente para finalizar pedidos.
      - `paginaCliente.js`: Página principal do dashboard do cliente.
      - `pedidosCliente.js`: Componente para visualizar pedidos do cliente.
    - **`global/`**:
      - `cadastro.js`: Página de cadastro de usuário.
      - `home.js`: Página inicial da aplicação.
      - `login.js`: Página de login do usuário.
      - `perfil.js`: Página de perfil do usuário.
    - **`restaurante/`**:
      - `addItemCardapio.js`: Componente para adicionar itens ao cardápio.
      - `editarItemCardapio.js`: Componente para editar itens do cardápio.
      - `paginaRestaurante.js`: Página principal do dashboard do restaurante.
      - `pedidoRestaurante.js`: Componente para gerenciar pedidos do restaurante.
  - **`App.css`**: Estilos para o componente principal App.
  - **`App.js`**: Componente React principal que configura roteamento e layout.
  - **`App.test.js`**: Arquivo de teste para o componente App.
  - **`index.js`**: Ponto de entrada da aplicação React.
  - **`reportWebVitals.js`**: Utilitários para monitoramento de performance.
  - **`setupTests.js`**: Configuração para setup de testes.
- **`.env`**: Variáveis de ambiente para o frontend (ex.: endpoints da API).
- **`package.json`**: Define dependências e scripts do frontend.
- **`package-lock.json`**: Bloqueia versões de dependências para reprodutibilidade.

## Pré-requisitos

Para executar a aplicação Yummy, você precisa instalar os seguintes softwares:

- **Python** (3.8 ou superior): Para o backend Flask.
- **Node.js** (16.x ou superior): Para o frontend React.
- **MySQL**: Para o banco de dados.
- **MySQL Workbench**: Para gerenciar e inicializar o banco de dados.
- **npm**: Vem com o Node.js, usado para gerenciar dependências do frontend.
- **pip**: Gerenciador de pacotes do Python para instalar Flask e outras dependências do backend.

## Instalação

### 1. Instalar Python
1. Baixe o Python em [python.org](https://www.python.org/downloads/).
2. Siga as instruções de instalação para o seu sistema operacional.
3. Verifique a instalação:
   ```bash
   python --version
   ```
4. Certifique-se de que o `pip` está instalado:
   ```bash
   pip --version
   ```

### 2. Instalar Node.js
1. Baixe o Node.js em [nodejs.org](https://nodejs.org/).
2. Siga as instruções de instalação para o seu sistema operacional.
3. Verifique a instalação:
   ```bash
   node --version
   npm --version
   ```

### 3. Instalar MySQL e MySQL Workbench
1. Baixe e instale o MySQL Server em [mysql.com](https://dev.mysql.com/downloads/mysql/).
2. Baixe e instale o MySQL Workbench em [mysql.com](https://dev.mysql.com/downloads/workbench/).
3. Configure o MySQL Workbench:
   - Abra o MySQL Workbench.
   - Crie uma conexão com o servidor MySQL (ex.: host `localhost`, usuário `root`, senha definida durante a instalação do MySQL).
   - Crie um banco de dados chamado `Yummy`:
     - No Workbench, clique em `File` > `New Query Tab`.
     - Execute o comando:
       ```sql
       CREATE DATABASE Yummy;
       ```
   - Importe o esquema do banco de dados:
     - No Workbench, vá em `Server` > `Data Import`.
     - Escolha `Import from Self-Contained File` e selecione o arquivo `backend/init.sql`.
     - Selecione o banco `Yummy` como destino e clique em `Start Import`.

### 4. Configurar o Backend (Flask)
1. Navegue para a pasta `backend`:
   ```bash
   cd backend
   ```
2. Instale as dependências do Python globalmente:
   ```bash
   pip install flask mysql-connector-python werkzeug
   ```
   - `flask`: Framework web para o backend.
   - `mysql-connector-python`: Driver para conectar ao MySQL.
   - `werkzeug`: Utilitários para Flask, incluindo `secure_filename`.
3. Configure o arquivo `connector.py` para corresponder às suas credenciais do banco de dados:
   Abra o arquivo `backend/connector.py` e edite as configurações de conexão conforme o exemplo abaixo, ajustando `host`, `user`, `password` e `database` conforme sua configuração do MySQL:
   ```python
   import mysql.connector

   def connect():
       return mysql.connector.connect(
           host="localhost",
           user="root",
           password="sua_senha_aqui",
           database="Yummy"
       )
   ```
   Substitua `"sua_senha_aqui"` pela senha do seu usuário MySQL. Certifique-se de que o nome do banco de dados é `Yummy`.

### 5. Configurar o Frontend (React)
1. Navegue para a pasta `front-end`:
   ```bash
   cd front-end
   ```
2. Instale as dependências do Node.js:
   ```bash
   npm install
   ```
   Isso criará a pasta `node_modules` se não existir.
3. Configure o arquivo `.env` com a URL da API do backend (ex.: `REACT_APP_API_URL=http://localhost:5000`).

## Executando a Aplicação

### Backend
1. Na pasta `backend`, execute:
   ```bash
   python app.py
   ```
   O servidor Flask rodará na porta 5000 por padrão (http://localhost:5000).

### Frontend
1. Na pasta `front-end`, execute:
   ```bash
   $env:PORT=3000; npm start
   ```
   (No Windows PowerShell. Para outros sistemas, use `PORT=3000 npm start` ou defina a variável de ambiente apropriada.)
   
   O servidor de desenvolvimento React abrirá em http://localhost:3000. Se a porta estiver ocupada, ele sugerirá a próxima disponível (ex.: 3001).

   A página recarregará automaticamente ao fazer alterações no código. Erros de linting podem aparecer no console.

## Scripts Disponíveis no Frontend

No diretório `front-end`, você pode executar:

### `npm start`
Executa o app em modo de desenvolvimento.  
Abra http://localhost:3000 para visualizá-lo no navegador.  
A página recarregará com alterações. Erros de linting aparecem no console.

### `npm test`
Executa o runner de testes em modo interativo.  
Consulte a [documentação do Create React App sobre testes](https://create-react-app.dev/docs/running-tests/) para mais informações.

### `npm run build`
Compila o app para produção na pasta `build`.  
Otimizado para performance, com minificação e hashes nos nomes de arquivos.  
Pronto para deploy!  
Consulte a [documentação sobre deployment](https://create-react-app.dev/docs/deployment/).


## Aprendendo Mais

- Documentação do [Create React App](https://create-react-app.dev/docs/getting-started/).
- Documentação do [React](https://pt-br.reactjs.org/).
- Documentação do [Flask](https://flask.palletsprojects.com/).


## Notas Adicionais
- Certifique-se de que o backend esteja rodando antes de iniciar o frontend para que as chamadas de API funcionem.
- Para produção, configure CORS no Flask se necessário e use HTTPS.
