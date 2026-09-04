# CardiShirt 

## AI-Powered Wearable ECG Monitoring System

CardiShirt is an intelligent wearable healthcare system that combines **IoT, Artificial Intelligence, and Web Technologies** to provide real-time ECG monitoring and cardiovascular risk screening.

The system uses a wearable ECG device powered by ESP32, a backend communication platform, and deep learning-based ECG analysis models to detect cardiac abnormalities and provide understandable health insights.


---

# Project Overview


CardiShirt aims to provide an affordable and intelligent cardiac monitoring solution by continuously collecting ECG signals from a wearable device and analyzing them using AI.


The system can:


- Capture real-time ECG signals
- Monitor heart rate
- Calculate HRV features
- Detect abnormal rhythms
- Detect possible myocardial infarction patterns
- Generate cardiac risk levels
- Provide AI-generated explanations
- Notify users and emergency contacts


---

# System Architecture


```
                         CardiShirt Wearable


                              ESP32

                                |

                                |

                         ECG Sensor Module

                                |

                                ↓


                    =========================

                         Backend Server

                    =========================


                                |

        -------------------------------------------------

        |                       |                       |

        ↓                       ↓                       ↓


    Database              AI Service              Notification


        |                       |

        |                       ↓


        |              CNN + LSTM Models


        |                       |

        |          ----------------------------

        |          |                          |

        |          ↓                          ↓


        |   Arrhythmia Model              MI Model

        |   MIT-BIH + MIT-SV              PTBDB


        |

        ↓


                  Frontend Dashboard


```

---

# Main Components


CardiShirt consists of three major parts:


```
CardiShirt

│

├── Frontend

│

├── Backend

│

└── AI Training Pipeline

```


---

# 1. Frontend


Technology:


```
React.js + Vite

```


Location:


```
/

```


The frontend provides the user interface for:


- Dashboard monitoring
- ECG visualization
- Risk analysis
- AI explanation
- Health diary
- Emergency contacts
- User settings


Main features:


✅ Real-time health dashboard  
✅ ECG waveform visualization  
✅ AI prediction display  
✅ Alert management  
✅ Health history tracking  


Detailed documentation:


```
Frontend README

```


---

# 2. Backend


Technology:


```
Node.js

Express.js

Prisma ORM

PostgreSQL

```


Location:


```
backend/

```


The backend works as the communication bridge between:


```
Frontend

      |

Backend

      |

ESP32 Device

      |

AI Service

```


Responsibilities:


- User authentication
- Device management
- ECG data receiving
- Database storage
- AI communication
- Risk calculation
- Emergency notification


Main technologies:


| Technology | Purpose |
|-|-|
| Express.js | REST API |
| Prisma | Database ORM |
| PostgreSQL | Data storage |
| JWT | Authentication |
| WebSocket | ESP32 communication |


---

# 3. AI Training Pipeline


Technology:


```
Python

PyTorch

FastAPI

```


Location:


```
ai-training/

```


The AI pipeline performs:


- ECG preprocessing
- Feature extraction
- Arrhythmia detection
- MI detection
- Risk evaluation
- Explanation generation


---

# AI Architecture


```
                 ECG Signal


                      |

                      ↓


              Layer 1

        Signal Processing


                      |

                      ↓


              Layer 2

          Deep Learning Models


          --------------------

          |                  |

          ↓                  ↓


   Arrhythmia Model       MI Model


    CNN + LSTM           CNN + LSTM


     MIT-BIH              PTBDB

     MIT-SV


          |

          ↓


          Decision Engine


          |

          ↓


              Layer 3

        Explainable AI


```

---

# AI Models


## Arrhythmia Detection


Model:


```
CNN + LSTM

```


Dataset:


```
MIT-BIH Arrhythmia Database

+

MIT Supraventricular Arrhythmia Database

```


Purpose:


Detect abnormal heart rhythms.


Examples:


- Normal rhythm
- PVC
- PAC
- Other rhythm abnormalities



---

## Myocardial Infarction Detection


Model:


```
CNN + LSTM

```


Dataset:


```
PTB Diagnostic ECG Database

```


Purpose:


Detect ECG patterns related to myocardial infarction.


The model learns:


- ST abnormalities
- ECG morphology changes
- MI-related waveform patterns



---

# Why CNN + LSTM?


ECG signals contain two important types of information.


## CNN


Learns:


- Waveform shape
- QRS morphology
- Local ECG patterns



## LSTM


Learns:


- Heartbeat sequence
- Rhythm changes
- Temporal dependencies



Combining:


```
CNN

+

LSTM


=

ECG morphology + rhythm understanding

```


---

# Wearable Hardware


Hardware platform:


```
ESP32

```


Connected sensors:


- ECG sensor
- Accelerometer


The wearable device collects:


- ECG samples
- Heart rate
- Motion information
- Fall detection information


Communication:


```
ESP32

    |

 WebSocket

    |

Backend

```


---

# Complete Data Flow


```
1. ECG Sensor captures signal


             ↓


2. ESP32 processes and sends data


             ↓


3. Backend receives ECG packet


             ↓


4. Data stored in database


             ↓


5. AI service analyzes ECG


             ↓


6. CNN-LSTM models generate prediction


             ↓


7. Decision engine calculates risk


             ↓


8. Frontend displays result


             ↓


9. Notification sent if required

```


---

# Features


## ECG Monitoring


- Real-time ECG streaming
- ECG waveform visualization
- Signal quality checking


---

## Cardiac Analysis


- Heart rate monitoring
- HRV calculation
- Arrhythmia detection
- MI risk screening


---

## AI-Based Risk Assessment


Possible outputs:


```
LOW

MODERATE

HIGH

CRITICAL

UNRELIABLE

```


---

## Emergency Support


The system can:


- Notify users
- Notify family members
- Send emergency alerts


---

# Repository Structure


```
CardiShirt/


│

├── frontend/

│

│
├── src/

│   ├── components/

│   ├── pages/

│   ├── services/

│   ├── routes/

│   └── store/


│

├── backend/

│

│
├── controllers/

│

├── routes/

│

├── services/

│

├── prisma/

│

└── server.js



│

├── ai-training/


│
├── data/

├── src/

├── models/

├── train.py

├── train_mi.py

└── README.md



│

└── README.md

```


---

# Installation


## Clone Repository


```bash
git clone https://github.com/yourusername/CardiShirt.git

cd CardiShirt

```


---

# Frontend Setup


```bash
cd frontend

npm install

npm run dev

```


Runs:


```
http://localhost:5173

```


---

# Backend Setup


```bash
cd backend

npm install

```


Configure:


```
.env

```


Run:


```bash
npm run dev

```


Backend:


```
http://localhost:5000

```


---

# AI Setup


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


AI API:


```
http://localhost:8000

```


---

# Environment Variables


Backend:


```env
DATABASE_URL=

JWT_SECRET=

AI_SERVER_URL=

PORT=5000

```


Frontend:


```env
VITE_API_URL=

```


AI:


```env
MODEL_PATH=

```


---

# Future Improvements


Possible future enhancements:


- Larger multi-lead ECG support
- Mobile application
- Cloud deployment
- Federated learning
- More cardiac disease classification
- Clinical validation


---

# Project Goal


CardiShirt aims to build an affordable AI-powered wearable ECG monitoring platform that enables early cardiac risk screening and continuous health monitoring.


---

# Technologies Used


## Frontend

- React.js
- Vite
- Redux Toolkit
- Axios


## Backend

- Node.js
- Express.js
- Prisma
- PostgreSQL
- WebSocket


## AI

- Python
- PyTorch
- CNN-LSTM
- FastAPI


## Hardware

- ESP32
- ECG Sensor
- Accelerometer


---

# CardiShirt 

## Intelligent Wearable ECG Monitoring Through AI