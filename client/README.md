<<<<<<< HEAD
# Book Trading Club - MERN Application

A full-stack MERN (MongoDB, Express, React, Node.js) application for managing book trades.

## Project Structure

```
BookTradingClub/
├── server/                 # Node.js/Express backend
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── controllers/   # Request handlers
│   │   ├── models/        # MongoDB schemas
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Custom middleware
│   │   └── index.js       # Server entry point
│   ├── package.json
│   └── .env.example
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── styles/        # CSS files
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. Navigate to server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your MongoDB URI and other settings

5. Start the development server:
   ```bash
   npm run dev
   ```

Server runs on `http://localhost:5000`

### Frontend Setup

1. Navigate to client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

App runs on `http://localhost:3000`

## Available Scripts

### Backend
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run tests

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Features (To be implemented)
- User authentication
- Book listings
- Trading system
- User profiles
- Search and filter

## Technologies Used

**Backend:**
- Express.js - Web framework
- MongoDB - Database
- Mongoose - ODM
- JWT - Authentication
- bcryptjs - Password hashing

**Frontend:**
- React - UI library
- Vite - Build tool
- Axios - HTTP client
- React Router - Navigation

## Next Steps

1. Set up MongoDB connection
2. Create User model and authentication
3. Create Book model and CRUD operations
4. Create Trade model for book exchanges
5. Build React components for UI
6. Implement API integration

## License

ISC
=======
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is currently not compatible with SWC. See [this issue](https://github.com/vitejs/vite-plugin-react/issues/428) for tracking the progress.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
>>>>>>> 536ee69 (MERN project template)
