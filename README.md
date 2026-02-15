# 🏥 Vet System API

API REST completa para sistema de gestão veterinária, permitindo gerenciamento de tutores, animais e prontuários de atendimento.

## 🚀 Tecnologias

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **Prisma ORM** - Object-Relational Mapping
- **PostgreSQL** - Banco de dados relacional
- **JWT** - Autenticação stateless
- **Bcrypt** - Hash de senhas
- **Docker** - Containerização para desenvolvimento

## 📋 Funcionalidades

### Autenticação
- ✅ Registro de usuários com senha criptografada
- ✅ Login com geração de token JWT
- ✅ Middleware de autenticação para rotas protegidas

### Gestão de Tutores (Owners)
- ✅ Cadastro completo com endereço
- ✅ Listagem de tutores
- ✅ Atualização de dados
- ✅ Exclusão de tutores

### Gestão de Animais
- ✅ Cadastro de animais vinculados a tutores
- ✅ Informações de espécie e raça
- ✅ Listagem e busca
- ✅ Atualização de dados
- ✅ Exclusão de animais

### Prontuários (Records)
- ✅ Registro de atendimentos
- ✅ Informações de peso, medicamentos e dosagem
- ✅ Campo de observações
- ✅ Data do atendimento
- ✅ Histórico completo por animal

## 🔒 Segurança

- **Helmet.js** - Headers HTTP seguros
- **CORS** - Controle de origens permitidas
- **Rate Limiting** - Proteção contra abuso (100 req/15min)
- **Bcrypt** - Hash de senhas com salt
- **JWT** - Tokens com expiração de 1 dia
- **Isolamento de dados** - Usuários só acessam seus próprios dados

## 📂 Estrutura do Projeto
```
src/
├── middlewares/
│   └── auth.js          # Middleware de autenticação JWT
├── routes/
│   ├── auth.js          # Rotas de login e registro
│   ├── user.js          # CRUD de usuários
│   ├── owner.js         # CRUD de tutores
│   ├── animal.js        # CRUD de animais
│   └── record.js        # CRUD de prontuários
├── prisma/
│   ├── schema.prisma    # Schema do banco de dados
│   └── migrations/      # Histórico de migrações
└── server.js            # Configuração principal do servidor
```

## 🗃️ Modelo de Dados
```
User (Veterinário)
  └── Owner (Tutor)
      └── Animal
          └── Record (Prontuário)
```

### Relacionamentos
- Um usuário pode ter múltiplos tutores
- Um tutor pode ter múltiplos animais
- Um animal pode ter múltiplos prontuários

## ⚙️ Instalação e Configuração

### Pré-requisitos
- Node.js 18+
- Docker e Docker Compose
- Git

### 1. Clone o repositório
```bash
git clone https://github.com/Duhandrade22/vet-system-api.git
cd vet-system-api
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto:
```env
DATABASE_URL="postgresql://admin:admin@localhost:5432/appdb"
JWT_SECRET="sua_chave_secreta_super_forte_aqui"
NODE_ENV="development"
PORT=3000
```

### 4. Suba o banco de dados com Docker
```bash
docker-compose up -d
```

### 5. Execute as migrations
```bash
npx prisma migrate dev
```

### 6. Inicie o servidor
```bash
npm run dev
```

A API estará disponível em `http://localhost:3000`

## 🔧 Scripts Disponíveis
```bash
npm run dev        # Inicia o servidor em modo desenvolvimento (com nodemon)
npm start          # Inicia o servidor em modo produção
npx prisma studio  # Interface visual do banco de dados
npx prisma migrate dev --name nome_da_migration  # Cria nova migration
```

## 📡 Endpoints da API

### Autenticação
```http
POST /users          # Registro de novo usuário
POST /login          # Login (retorna JWT)
```

### Tutores
```http
GET    /owners       # Lista todos os tutores
POST   /owners       # Cria novo tutor
GET    /owners/:id   # Busca tutor por ID
PATCH  /owners/:id   # Atualiza tutor
DELETE /owners/:id   # Remove tutor
```

### Animais
```http
GET    /animals      # Lista todos os animais
POST   /animals      # Cria novo animal
GET    /animals/:id  # Busca animal por ID
PATCH  /animals/:id  # Atualiza animal
DELETE /animals/:id  # Remove animal
```

### Prontuários
```http
GET    /records      # Lista todos os prontuários
POST   /records      # Cria novo prontuário
GET    /records/:id  # Busca prontuário por ID
PATCH  /records/:id  # Atualiza prontuário
DELETE /records/:id  # Remove prontuário
```

**Obs:** Todas as rotas exceto `/users` e `/login` requerem autenticação via header:
```
Authorization: Bearer {seu_token_jwt}
```

## 📝 Exemplos de Requisições

### Registro de usuário
```json
POST /users
{
  "name": "Dr. João Silva",
  "email": "joao@email.com",
  "password": "senha123"
}
```

### Login
```json
POST /login
{
  "email": "joao@email.com",
  "password": "senha123"
}
```

### Criar tutor
```json
POST /owners
Headers: Authorization: Bearer {token}
{
  "name": "Maria Santos",
  "phone": "11987654321",
  "email": "maria@email.com",
  "street": "Rua das Flores",
  "number": "123",
  "complement": "Apto 45",
  "neighborhood": "Centro",
  "city": "São Paulo",
  "state": "SP",
  "zipCode": "01234567"
}
```

### Criar animal
```json
POST /animals
Headers: Authorization: Bearer {token}
{
  "name": "Rex",
  "species": "Cachorro",
  "breed": "Golden Retriever",
  "ownerId": "uuid-do-tutor"
}
```

### Criar prontuário
```json
POST /records
Headers: Authorization: Bearer {token}
{
  "weight": "25.5",
  "medications": "Dipirona",
  "dosage": "1g",
  "notes": "Animal apresentou febre. Medicação administrada.",
  "attendedAt": "2026-02-13T14:30:00Z",
  "animalId": "uuid-do-animal"
}
```

## 🌐 Deploy

A aplicação está configurada para deploy no Render:

1. Conecte seu repositório GitHub ao Render
2. Configure as variáveis de ambiente
3. O Render executará automaticamente:
   - `npm install`
   - `npx prisma generate`
   - `npx prisma migrate deploy`
   - `node src/server.js`

**URL em produção:** [https://vet-system-api.onrender.com](https://vet-system-api.onrender.com)

## 🧪 Testando a API

Recomendamos usar:
- [Insomnia](https://insomnia.rest/)
- [Postman](https://www.postman.com/)
- [Thunder Client](https://www.thunderclient.com/) (extensão VS Code)

Ou teste o health check direto no navegador:
```
https://vet-system-api.onrender.com/health
```

## 🛠️ Desenvolvimento

### Visualizar banco de dados
```bash
npx prisma studio
```

### Criar nova migration
```bash
npx prisma migrate dev --name descricao_da_alteracao
```

### Resetar banco de dados (CUIDADO!)
```bash
npx prisma migrate reset
```

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**Eduardo Andrade**

- GitHub: [@Duhandrade22](https://github.com/Duhandrade22)
- LinkedIn: [Seu LinkedIn](https://linkedin.com/in/seu-perfil)

---

⭐ Se este projeto te ajudou, deixe uma estrela no repositório!
