<div align="center">

# 🫀 CardiShirt

### AI-Powered Wearable ECG Monitoring System

*Continuous cardiac monitoring and early risk screening, powered by IoT and deep learning.*

![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)
![ESP32](https://img.shields.io/badge/ESP32-E7352C?style=for-the-badge&logo=espressif&logoColor=white)
![Status](https://img.shields.io/badge/status-active%20development-yellow?style=for-the-badge)

</div>

---

## Table of Contents

- [Project Overview](#project-overview)
- [System Architecture](#system-architecture)
- [Main Components](#main-components)
- [AI Architecture](#ai-architecture)
- [AI Models](#ai-models)
- [Why CNN + LSTM?](#why-cnn--lstm)
- [Wearable Hardware](#wearable-hardware)
- [Complete Data Flow](#complete-data-flow)
- [Features](#features)
- [Repository Structure](#repository-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Future Improvements](#future-improvements)
- [Technologies Used](#technologies-used)

---

## Project Overview

CardiShirt aims to provide an **affordable and intelligent cardiac monitoring solution** by continuously collecting ECG signals from a wearable device and analyzing them using AI.

The system can:

- 📡 Capture real-time ECG signals
- ❤️ Monitor heart rate
- 📊 Calculate HRV features
- 🔍 Detect abnormal rhythms
- 🚨 Detect possible myocardial infarction patterns
- 🧮 Generate cardiac risk levels
- 🤖 Provide AI-generated explanations
- 📣 Notify users and emergency contacts

---

## System Architecture

```mermaid
flowchart TD
    ESP32[CardiShirt Wearable — ESP32] --> Sensor[ECG Sensor Module]
    Sensor --> Backend[Backend Server]

    Backend --> DB[(Database)]
    Backend --> AIS[AI Service]
    Backend --> Notif[Notification]

    AIS --> Models[CNN + LSTM Models]
    Models --> Arr["Arrhythmia Model<br/>MIT-BIH + MIT-SVDB"]
    Models --> MI["MI Model<br/>PTBDB"]

    DB --> FE[Frontend Dashboard]

    classDef hardware fill:#e7352c,stroke:#a6231a,color:#fff
    classDef server fill:#339933,stroke:#1f6b1f,color:#fff
    classDef ai fill:#ee4c2c,stroke:#a8331d,color:#fff
    classDef data fill:#4169e1,stroke:#2a4aa8,color:#fff
    classDef ui fill:#61dafb,stroke:#2596be,color:#000

    class ESP32,Sensor hardware
    class Backend,Notif server
    class AIS,Models,Arr,MI ai
    class DB data
    class FE ui
```

---

## Main Components

CardiShirt consists of three major parts:

```
CardiShirt
│
├── Frontend
├── Backend
└── AI Training Pipeline
```

### 1. Frontend

| | |
|---|---|
| **Technology** | React.js + Vite |
| **Location** | Repository root — see the [correction note](#repository-structure) below |

The frontend provides the user interface for:

- Dashboard monitoring
- ECG visualization
- Risk analysis
- AI explanation
- Health diary
- Emergency contacts
- User settings

**Main features:**

✅ Real-time health dashboard
✅ ECG waveform visualization
✅ AI prediction display
✅ Alert management
✅ Health history tracking

### 2. Backend

| | |
|---|---|
| **Technology** | Node.js, Express.js, Prisma ORM, PostgreSQL |
| **Location** | `backend/` |

The backend works as the communication bridge between:

```mermaid
flowchart LR
    FE[Frontend] --> BE[Backend]
    BE --> ESP[ESP32 Device]
    BE --> AI[AI Service]
```

**Responsibilities:**

- User authentication
- Device management
- ECG data receiving
- Database storage
- AI communication
- Risk calculation
- Emergency notification

**Main technologies:**

| Technology | Purpose |
|---|---|
| Express.js | REST API |
| Prisma | Database ORM |
| PostgreSQL | Data storage |
| JWT | Authentication |

### 3. AI Training Pipeline

| | |
|---|---|
| **Technology** | Python, PyTorch, FastAPI |
| **Location** | `ai-training/` |

The AI pipeline performs:

- ECG preprocessing
- Feature extraction
- Arrhythmia detection
- MI detection
- Risk evaluation
- Explanation generation

---

## AI Architecture

```mermaid
flowchart TD
    Signal[ECG Signal] --> L1["Layer 1<br/>Signal Processing"]
    L1 --> L2["Layer 2<br/>Deep Learning Models"]

    L2 --> Arr["Arrhythmia Model<br/>CNN + LSTM<br/>MIT-BIH + MIT-SVDB"]
    L2 --> MI["MI Model<br/>CNN + LSTM<br/>PTBDB"]

    Arr --> DE[Decision Engine]
    MI --> DE

    DE --> L3["Layer 3<br/>Explainable AI"]

    classDef stage fill:#4169e1,stroke:#2a4aa8,color:#fff
    classDef model fill:#ee4c2c,stroke:#a8331d,color:#fff
    classDef decide fill:#f6b026,stroke:#a87218,color:#000

    class Signal,L1,L3 stage
    class L2,Arr,MI model
    class DE decide
```

---

## AI Models

### Arrhythmia Detection

| | |
|---|---|
| **Model** | CNN + LSTM |
| **Dataset** | MIT-BIH Arrhythmia Database + MIT Supraventricular Arrhythmia Database |
| **Purpose** | Detect abnormal heart rhythms |

Examples detected: Normal rhythm, PVC, PAC, and other rhythm abnormalities.

### Myocardial Infarction Detection

| | |
|---|---|
| **Model** | CNN + LSTM |
| **Dataset** | PTB Diagnostic ECG Database |
| **Purpose** | Detect ECG patterns related to myocardial infarction |

The model learns: ST abnormalities, ECG morphology changes, and MI-related waveform patterns.

---

## Why CNN + LSTM?

ECG signals contain two important types of information:

| Network | Learns |
|---|---|
| **CNN** | Waveform shape, QRS morphology, local ECG patterns |
| **LSTM** | Heartbeat sequence, rhythm changes, temporal dependencies |

**Combining CNN + LSTM = ECG morphology understanding + rhythm understanding.**

---

## Wearable Hardware

| | |
|---|---|
| **Platform** | ESP32 |
| **Sensors** | ECG sensor, Accelerometer |

The wearable device collects:

- ECG samples
- Heart rate
- Motion information
- Fall detection information

**Communication:** ESP32 → Backend, via a REST API over HTTP.

> [!WARNING]
> This was previously documented as WebSocket — checked against the actual backend code (`package.json` has no `ws`/`socket.io` dependency, and `/api/ecg/ingest` is a plain Express `POST` route), so this has been corrected to REST/HTTP.

---

## Complete Data Flow

```mermaid
flowchart TD
    S1["1. ECG Sensor captures signal"] --> S2["2. ESP32 processes and sends data"]
    S2 --> S3["3. Backend receives ECG packet"]
    S3 --> S4["4. Data stored in database"]
    S4 --> S5["5. AI service analyzes ECG"]
    S5 --> S6["6. CNN-LSTM models generate prediction"]
    S6 --> S7["7. Decision engine calculates risk"]
    S7 --> S8["8. Frontend displays result"]
    S8 --> S9["9. Notification sent if required"]
```

---

## Features

### ECG Monitoring
- Real-time ECG streaming
- ECG waveform visualization
- Signal quality checking

### Cardiac Analysis
- Heart rate monitoring
- HRV calculation
- Arrhythmia detection
- MI risk screening

### AI-Based Risk Assessment

Possible outputs:

![LOW](https://img.shields.io/badge/risk-LOW-brightgreen?style=for-the-badge)
![MODERATE](https://img.shields.io/badge/risk-MODERATE-yellow?style=for-the-badge)
![HIGH](https://img.shields.io/badge/risk-HIGH-orange?style=for-the-badge)
![CRITICAL](https://img.shields.io/badge/risk-CRITICAL-red?style=for-the-badge)
![UNRELIABLE](https://img.shields.io/badge/risk-UNRELIABLE-lightgrey?style=for-the-badge)

### Emergency Support

The system can:

- Notify users
- Notify family members
- Send emergency alerts

---

## Repository Structure

> [!WARNING]
> **Correction from the original doc:** the frontend isn't in its own `frontend/` folder — its source (`components/`, `pages/`, `services/`, `routes/`, `store/`, etc.) lives directly under `src/` at the repository root, alongside `vite.config.js`, `index.html`, and `package.json`. The tree below reflects the real, current layout. This also affects the [Installation](#installation) commands further down.

<details>
<summary>📁 Click to expand full repository tree</summary>

```
CardiShirt/
│
├── src/                      # Frontend source (React + Vite)
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── routes/
│   └── store/
├── public/
├── index.html
├── vite.config.js
├── package.json
│
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   ├── prisma/
│   └── server.js
│
├── ai-training/
│   ├── data/
│   ├── src/
│   ├── models/
│   ├── train.py
│   ├── train_mi.py
│   └── README.md
│
├── hardwareCode/             # ESP32 firmware
│
└── README.md
```

</details>

---

## Installation

### Clone Repository

```bash
git clone https://github.com/yourusername/CardiShirt.git
cd CardiShirt
```

### Frontend Setup

> Run from the **repository root** — there's no separate `frontend/` folder to `cd` into (see the [Repository Structure](#repository-structure) note above).

```bash
npm install
npm run dev
```

Runs at:

```
http://localhost:5173
```

### Backend Setup

```bash
cd backend
npm install
```

Configure your `.env` file (see [Environment Variables](#environment-variables)), then:

```bash
npm run dev
```

Backend runs at:

```
http://localhost:5000
```

### AI Setup

```bash
cd ai-training
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Run:

```bash
python src/api/main.py
```

AI API runs at:

```
http://localhost:8000
```

---

## Environment Variables

> [!TIP]
> **Expanded from the original doc** to match what the backend actually requires today — the AI-explanation and family-notification features need a few keys that weren't previously listed.

**Backend** (`backend/.env`):

```env
DATABASE_URL=
JWT_SECRET=
PORT=5000

# AI-generated explanations (Gemini)
GEMINI_API_KEY=

# Family/emergency notifications
TELEGRAM_BOT_TOKEN=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Optional — tunes how device readings roll into daily metrics
DEVICE_SAMPLE_INTERVAL_MIN=1
```

**Frontend** (`.env`, repository root):

```env
VITE_API_URL=
```

**AI** (`ai-training/.env`):

```env
MODEL_PATH=
```

---

## Future Improvements

- Larger multi-lead ECG support
- Mobile application
- Cloud deployment
- Federated learning
- More cardiac disease classification
- Clinical validation

---

## Project Goal

CardiShirt aims to build an affordable AI-powered wearable ECG monitoring platform that enables early cardiac risk screening and continuous health monitoring.

---

## Technologies Used

<table>
<tr>
<td valign="top">

**Frontend**
- React.js
- Vite
- Redux Toolkit
- Axios

</td>
<td valign="top">

**Backend**
- Node.js
- Express.js
- Prisma
- PostgreSQL

</td>
<td valign="top">

**AI**
- Python
- PyTorch
- CNN-LSTM
- FastAPI

</td>
<td valign="top">

**Hardware**
- ESP32
- ECG Sensor
- Accelerometer

</td>
</tr>
</table>

<div align="center">

---

🫀 **Made for early cardiac risk screening, one heartbeat at a time.**

</div>
