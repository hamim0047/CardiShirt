# CardiShirt Backend API

## Overview

The CardiShirt Backend is the central communication layer between:

- CardiShirt frontend application
- ESP32 wearable ECG device
- AI ECG analysis service
- Database
- Notification systems


The backend is responsible for:

- User authentication
- Device management
- ECG data ingestion
- AI prediction communication
- Risk evaluation
- Emergency alerts
- Health diary management
- Family notifications
- ECG history storage


---

# Backend Architecture


```
                 Frontend Application
                         |
                         |
                         ↓

                Express REST API

                         |
        --------------------------------

        |              |              |

     Controllers     Services       Prisma

        |              |              |

        ↓              ↓              ↓

     Business      External       PostgreSQL
      Logic        Services       Database


                         |

                         ↓


                  ESP32 ECG Device


                         |

                         ↓


                AI Training Pipeline

                (FastAPI Service)

```


---

# Technology Stack


## Backend Framework

```
Node.js
+
Express.js
```


## Database

```
PostgreSQL
+
Prisma ORM
```


## Authentication

```
JWT Authentication
```


## Communication

```
REST API

WebSocket

HTTP Requests

```


## AI Communication

```
Node.js Backend

        |

        ↓

FastAPI AI Server

        |

        ↓

CNN-LSTM ECG Models

```


---

# Project Structure


```
backend/


├── controllers/

│
├── routes/

│
├── services/

│
├── middleware/

│
├── prisma/

│
├── generated/

│
├── models/

│
├── utils/

│
├── app.js

├── server.js

├── package.json

└── .env

```


---

# Controllers


Location:


```
controllers/
```


Controllers handle API requests and connect routes with services.


## Available Controllers


```
aiController.js

alertController.js

authController.js

chatController.js

deviceController.js

diaryController.js

ecgController.js

emergencyContactController.js

riskController.js

```


---

# Authentication Controller


File:


```
authController.js
```


Responsibilities:


- User registration
- Login
- Password handling
- JWT token generation
- User session management



Flow:


```
User

 ↓

Login Request

 ↓

Authentication

 ↓

JWT Token

 ↓

Protected APIs

```


---

# Device Controller


File:


```
deviceController.js
```


Manages:


- Device registration
- Device ownership
- Device status


Example:


```
User

   |

   ↓

ESP32 Device

   |

   ↓

Device ID

```


---

# ECG Controller


File:


```
ecgController.js
```


Main responsibility:


Receive ECG data from ESP32 and process it.


ECG workflow:


```
ESP32

 ↓

Backend API

 ↓

Store ECG

 ↓

Send ECG to AI

 ↓

Receive Prediction

 ↓

Generate Risk

 ↓

Send Response

```


---

# ECG Data Processing


Incoming ECG packet:


```json
{
 "deviceId":"ESP001",

 "samplingRate":250,

 "lead1":[
  100,
  120,
  140
 ],

 "heartRate":75
}

```


Backend performs:


1. Validate ECG packet

2. Store ECG record

3. Send signal to AI service

4. Receive AI prediction

5. Evaluate risk

6. Generate alert if needed



---

# AI Controller


File:


```
aiController.js
```


Purpose:


Connect backend with AI inference server.


Flow:


```
ECG Signal

      |

      ↓

Backend

      |

      ↓

FastAPI AI Service

      |

      ↓

CNN-LSTM Models

      |

      ↓

Prediction

```


AI output includes:


- Arrhythmia prediction
- MI prediction
- Confidence score
- Risk level



---

# Routes


Location:


```
routes/
```


Routes define API endpoints.


Available routes:


```
authRoutes.js

deviceRoutes.js

ecgRoutes.js

alertRoutes.js

aiRoutes.js

chatRoutes.js

diaryRoutes.js

emergencyContactRoutes.js

riskRoutes.js

index.js

```


---

# Main Route Configuration


File:


```
routes/index.js
```


All routes are registered here.


Example:


```
/auth

/devices

/ecg

/alerts

/ai

/chat

/diary

/risk

/emergency-contacts

```


---

# Services


Location:


```
services/
```


Services contain reusable business logic.


---

# AI Service


File:


```
aiService.js
```


Responsible for:


- AI explanation generation
- Processing AI output
- Creating patient-friendly messages



---

# ML Service


File:


```
mlService.js
```


Communicates with FastAPI AI server.


Flow:


```
Node Backend

      |

      ↓

FastAPI

      |

      ↓

AI Pipeline

      |

      ↓

Prediction Result

```


---

# ESP32 Communication


Files:


```
esp32Client.js

esp32Socket.js

```


Purpose:


Receive live ECG data from wearable device.


Communication:


```
ESP32

 |

 | WebSocket

 ↓

Node Backend

```


Received data:


- ECG samples
- Heart rate
- Accelerometer
- Fall detection



---

# Decision Engine


File:


```
decisionEngine.js
```


Combines:


- AI prediction
- Heart rate
- HRV
- ECG metrics


Produces:


```
MONITOR

HIGH RISK

CRITICAL

```


Example:


```
AI:
MI detected


+

High confidence


=

HIGH RISK ALERT

```


---

# Notification System


Files:


```
notificationService.js

telegramService.js

```


Handles:


- User notification
- Family notification
- Emergency notification


Example:


```
HIGH RISK ECG

        |

        ↓

Patient Notification

        |

        ↓

Family Telegram Alert

```


---

# Risk Management


Files:


```
riskController.js

riskScoreService.js

```


Responsible for:


- Risk calculation
- Daily risk scoring
- Health status tracking


---

# Health Diary System


Files:


```
diaryController.js

diaryRoutes.js

dailyMetricService.js

```


Stores:


- Daily heart information
- ECG summaries
- Health journal
- Activity information



---

# Database


CardiShirt uses:


```
PostgreSQL

+

Prisma ORM

```


Schema:


```
prisma/schema.prisma

```


Database entities include:


- User
- Device
- ECG Record
- Alert
- Emergency Contact
- Diary Entry
- Health Metrics


---

# Prisma Setup


Install:


```bash
npm install
```


Generate Prisma client:


```bash
npx prisma generate
```


Run migration:


```bash
npx prisma migrate dev
```


---

# Environment Configuration


Create:


```
.env

```


Example:


```env
DATABASE_URL="postgresql://username:password@localhost:5432/cardishirt"


JWT_SECRET="your_secret"


AI_SERVER_URL="http://localhost:8000"


PORT=5000

```


---

# Installation


Navigate:


```bash
cd backend
```


Install dependencies:


```bash
npm install
```


---

# Running Backend


Development:


```bash
npm run dev
```


Production:


```bash
npm start
```


Server:


```
http://localhost:5000

```


---

# API Endpoints


## Authentication


```
POST /api/auth/register

POST /api/auth/login

```


---

## Device


```
GET /api/devices

POST /api/devices

```


---

## ECG


```
POST /api/ecg

GET /api/ecg/latest

GET /api/ecg/history

```


---

## AI Analysis


```
POST /api/ai/analyze

```


---

## Alerts


```
GET /api/alerts

```


---

## Risk


```
GET /api/risk

```


---

## Diary


```
GET /api/diary

POST /api/diary

```


---

# Complete Data Flow


```
ESP32 ECG Sensor

        |

        ↓

Backend WebSocket

        |

        ↓

ECG Controller

        |

        ↓

Database Storage

        |

        ↓

ML Service

        |

        ↓

FastAPI AI Model

        |

        ↓

Prediction

        |

        ↓

Decision Engine

        |

        ↓

Risk Classification

        |

        ↓

Notification Service

        |

        ↓

User / Family Alert

```


---

# Error Handling


Middleware:


```
middleware/errorMiddleware.js

```


Handles:


- API errors
- Database errors
- Validation errors
- Server errors


---

# Security Features


Implemented:


- JWT authentication
- Protected routes
- Password encryption
- Request validation
- Database security


---

# Development Workflow


## Start Database


```
PostgreSQL

```


## Start AI Server


```
FastAPI

```


## Start Backend


```
npm run dev

```


## Start Frontend


```
npm run dev

```


System:


```
Frontend

    ↓

Backend

    ↓

AI Server

    ↓

Database

```


---

# Summary


The CardiShirt Backend provides the complete bridge between wearable hardware, AI models, database, and users.

Main responsibilities:


✅ User management  
✅ Device communication  
✅ ECG ingestion  
✅ AI integration  
✅ Risk analysis  
✅ Emergency notification  
✅ Health tracking  
✅ Data management  


CardiShirt Backend enables real-time AI-powered wearable ECG monitoring.