## Backend Setup (FastAPI)
Open a terminal and navigate to the backend directory:

```bash 
cd src/app/backend
```

Create and activate a Python virtual environment:

```bash
python -m venv .venv
.venv\Scripts\activate
```

Install backend dependencies:

```bash
pip install -r requirements.txt
```

Start the backend server:

```bash
python -m uvicorn main:app --reload
```

The backend server will be available at: 
http://127.0.0.1:8000

API documentation (Swagger UI): 
http://127.0.0.1:8000/docs


## Frontend Setup (React)
Open a new terminal window and navigate to the frontend directory:

```bash
cd src/app/frontend
```

Install frontend dependencies:

```bash 
npm install
```

Start the frontend application:

```bash
npm start
```

The frontend will be available at:
http://localhost:3000
