# Synchronicity Backend

## 🚀 Overview
Synchronicity is a cutting-edge **crypto trading platform** designed to provide **real-time market data, portfolio tracking, and automated trading**. The backend is built with **FastAPI, PostgreSQL, and WebSockets** to ensure high performance and scalability.

## 🔧 Features
- **User Authentication** (JWT-based login & signup)
- **Real-time Market Data** (WebSockets & REST API integration)
- **Automated Trading Engine** (Limit, Market, Stop Orders)
- **Portfolio Management** (Track balances & trade history)
- **Secure API Integration** (Binance, Coinbase, KuCoin, etc.)

## 📦 Tech Stack
- **Framework:** FastAPI (Python)
- **Database:** PostgreSQL
- **WebSockets:** Real-time price updates
- **Message Queue:** RabbitMQ/Kafka (for trade execution)
- **Caching:** Redis (for performance boost)
- **Authentication:** JWT + OAuth2

## 🛠️ Installation & Setup
### 1️⃣ Clone the Repository
```bash
git clone https://github.com/squidchemistry/synchronicity-backend.git
cd synchronicity-backend
```

### 2️⃣ Set Up a Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
```

### 3️⃣ Install Dependencies
```bash
pip install -r requirements.txt
```

### 4️⃣ Set Up PostgreSQL Database
```bash
sudo -i -u postgres
psql
CREATE DATABASE synchronicity;
CREATE USER trader WITH ENCRYPTED PASSWORD 'securepassword';
GRANT ALL PRIVILEGES ON DATABASE synchronicity TO trader;
\q
```

### 5️⃣ Configure Environment Variables
Create a `.env` file in the root directory:
```ini
DATABASE_URL=postgresql://trader:securepassword@localhost/synchronicity
SECRET_KEY=your_secret_key_here
```

### 6️⃣ Run the Server
```bash
uvicorn main:app --reload
```
Now visit: **`http://127.0.0.1:8000/docs`** to explore the API!

## 📡 API Endpoints
| Method | Endpoint | Description |
|--------|------------|-------------|
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/login` | User login (JWT-based) |
| `GET` | `/market/ticker/:symbol` | Get real-time price of a coin |
| `POST` | `/trade/order` | Place a buy/sell order |
| `GET` | `/portfolio` | Fetch user portfolio data |
| `GET` | `/history/orders` | Get trade history |

## 🛠️ Contributing
We welcome contributions! To contribute:
1. Fork the repo
2. Create a new branch (`git checkout -b feature-branch`)
3. Commit your changes (`git commit -m "Added a new feature"`)
4. Push to your branch (`git push origin feature-branch`)
5. Open a Pull Request

## 🛡 Security
- Uses **JWT authentication** for secure API access
- **Rate limiting & DDoS protection**
- Secure **API key storage** (Environment Variables)

## 📜 License
This project is licensed under the **MIT License**.

## 💬 Connect with Us
Follow us on Twitter: [@yourhandle](https://twitter.com/yourhandle)
Join our Discord: [Discord Link](https://discord.com/invite/yourserver)

---
⭐ **Star this repo** if you find it useful!

