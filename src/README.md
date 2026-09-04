# CardiShirt Frontend

## AI-Powered Wearable ECG Monitoring System

The CardiShirt Frontend is the user interface of the CardiShirt platform.

It provides users with a modern dashboard to monitor:

- Real-time ECG signals
- Heart rate
- HRV information
- AI cardiac predictions
- Risk levels
- Emergency alerts
- Health diary
- Family contacts
- Personal settings


The frontend communicates with:

- CardiShirt Backend API
- ESP32 wearable ECG device
- AI ECG analysis pipeline


---

# Application Architecture


```
                    User

                     |

                     ↓


              React Frontend


                     |

        ----------------------------

        |                          |

        ↓                          ↓


   Backend API                AI Services


        |

        ↓


   Database + ESP32 Device


```


---

# Technology Stack


## Frontend Framework

```
React.js
```


## Build Tool

```
Vite
```


## Programming Language

```
JavaScript / JSX
```


## Styling

```
CSS

Custom Components

```


## State Management

```
Redux Toolkit

```


## Routing

```
React Router DOM

```


## API Communication

```
Axios

```


---

# Project Structure


```
src/


├── assets/


├── components/


├── layouts/


├── pages/


├── routes/


├── services/


├── store/


├── App.jsx


├── main.jsx


├── App.css


└── index.css

```


---

# Component Architecture


Location:


```
src/components/

```


Reusable UI components are separated by functionality.


Structure:


```
components/


├── ai/

│   └── AIChatPanel.jsx


├── alerts/

│   └── AlertCard.jsx


├── common/

│   ├── Loader.jsx

│   ├── SectionCard.jsx

│   ├── Sidebar.jsx

│   └── Topbar.jsx


├── dashboard/

│   └── StatCard.jsx


└── ecg/

    └── ECGChart.jsx

```


---

# Common Components


## Sidebar


File:


```
components/common/Sidebar.jsx
```


Purpose:


Provides navigation between:


- Dashboard
- ECG Records
- Risk
- Diary
- Family
- Settings



---

## Topbar


File:


```
components/common/Topbar.jsx
```


Contains:


- User information
- Notifications
- Page controls



---

## Loader


File:


```
components/common/Loader.jsx
```


Used when:


- API data is loading
- AI analysis is processing



---

# ECG Components


Location:


```
components/ecg/

```


## ECGChart


File:


```
ECGChart.jsx

```


Purpose:


Visualizes:


- Live ECG waveform
- Recorded ECG signal
- Signal changes over time


Data source:


```
Backend ECG API

        ↓

Frontend Chart

```


---

# AI Components


Location:


```
components/ai/

```


## AIChatPanel


File:


```
AIChatPanel.jsx

```


Purpose:


Provides AI assistant interaction.


Features:


- ECG explanation
- Health questions
- Risk explanation



---

# Alert Components


Location:


```
components/alerts/

```


## AlertCard


File:


```
AlertCard.jsx

```


Displays:


- Alert severity
- Alert message
- Time
- Status



---

# Layout System


Location:


```
layouts/

```


The application uses different layouts for different sections.


---

# Authentication Layout


File:


```
AuthLayout.jsx

```


Used for:


- Login page
- Registration page



---

# Main Layout


File:


```
MainLayout.jsx

```


Contains:


- Sidebar
- Topbar
- Main application content



---

# Pages


Location:


```
src/pages/

```


Pages represent complete application screens.


Structure:


```
pages/


├── auth/

│
├── LoginPage.jsx

└── RegisterPage.jsx



├── DashboardPage.jsx

├── DiaryPage.jsx

├── FamilyPage.jsx

├── RecordPage.jsx

├── RiskPage.jsx

└── SettingsPage.jsx

```


---

# Authentication Pages


## Login Page


File:


```
LoginPage.jsx

```


Features:


- User login
- JWT authentication
- Redirect after login



---

## Register Page


File:


```
RegisterPage.jsx

```


Features:


- Account creation
- User information setup



---

# Dashboard Page


File:


```
DashboardPage.jsx

```


Main health monitoring screen.


Displays:


- Current heart rate
- ECG status
- Risk level
- Latest AI prediction
- Health statistics



---

# Diary Page


File:


```
DiaryPage.jsx

```


Purpose:


Allows users to:


- View health history
- Add journal entries
- Track daily health information



---

# Family Page


File:


```
FamilyPage.jsx

```


Manages:


- Emergency contacts
- Family notification settings



---

# Record Page


File:


```
RecordPage.jsx

```


Displays:


- Previous ECG records
- AI analysis results
- ECG history



---

# Risk Page


File:


```
RiskPage.jsx

```


Displays:


- Cardiac risk score
- Risk category
- Health recommendations



---

# Settings Page


File:


```
SettingsPage.jsx

```


Manages:


- Account settings
- Device settings
- Application preferences



---

# Routing System


Location:


```
src/routes/

```


Files:


```
AppRoutes.jsx

ProtectedRoute.jsx

PublicRoute.jsx

```


---

# Public Routes


Available without login:


Example:


```
/login

/register

```


Handled by:


```
PublicRoute.jsx

```


---

# Protected Routes


Require authentication.


Examples:


```
/dashboard

/records

/risk

/diary

/family

/settings

```


Handled by:


```
ProtectedRoute.jsx

```


---

# Services Layer


Location:


```
src/services/

```


Services handle communication with backend APIs.


Structure:


```
services/


├── api.js

├── aiService.js

├── alertService.js

├── authServices.js

├── chatService.js

├── ecgService.js

└── emergencyContactService.js

```


---

# API Service


File:


```
api.js

```


Creates the Axios instance.


Responsibilities:


- Backend URL configuration
- Request handling
- Authentication token attachment



---

# Authentication Service


File:


```
authServices.js

```


Handles:


- Login
- Register
- Logout
- User session



---

# ECG Service


File:


```
ecgService.js

```


Handles:


- Fetch ECG records
- Latest ECG data
- ECG analysis request



Flow:


```
ESP32

 ↓

Backend

 ↓

Frontend

 ↓

ECG Chart

```


---

# AI Service


File:


```
aiService.js

```


Handles:


- AI prediction requests
- AI explanation
- Risk interpretation



---

# Alert Service


File:


```
alertService.js

```


Handles:


- Fetch alerts
- Alert history
- Alert status



---

# Chat Service


File:


```
chatService.js

```


Handles:


- AI assistant communication
- User questions



---

# Emergency Contact Service


File:


```
emergencyContactService.js

```


Handles:


- Add contacts
- Remove contacts
- Family notification setup



---

# State Management


Location:


```
src/store/

```


Uses:


```
Redux Toolkit

```


Structure:


```
store/


├── index.js

└── slices/

```


Stores:


- Authentication state
- User information
- Application state



---

# Application Flow


```
User Login

      |

      ↓

Authentication

      |

      ↓

Dashboard


      |

      ↓


Receive ECG Data


      |

      ↓


Backend API


      |

      ↓


AI Analysis


      |

      ↓


Display Result


      |

      ↓


Risk / Alert / Explanation

```


---

# Installation


Navigate:


```bash
cd CardiShirt
```


Install dependencies:


```bash
npm install

```


---

# Environment Setup


Create:


```
.env

```


Example:


```env
VITE_API_URL=http://localhost:5000/api

```


---

# Running Frontend


Development:


```bash
npm run dev

```


Application starts:


```
http://localhost:5173

```


---

# Production Build


Create production build:


```bash
npm run build

```


Preview:


```bash
npm run preview

```


---

# Backend Connection


Frontend communicates with backend through:


```
Axios API Requests

```


Example:


```
Frontend

   |

   ↓

Express Backend

   |

   ↓

AI Service

   |

   ↓

Database

```


---

# Complete System Data Flow


```
ESP32 ECG Sensor

        |

        ↓

Backend Server

        |

        ↓

AI ECG Analysis

        |

        ↓

Prediction Result

        |

        ↓

Frontend Dashboard

        |

        ↓

User Visualization


```


---

# Features Implemented


## Authentication

✅ Login  
✅ Registration  
✅ Protected routes  


## ECG Monitoring

✅ ECG visualization  
✅ ECG records  
✅ Heart monitoring  


## AI Features

✅ Arrhythmia prediction display  
✅ MI prediction display  
✅ AI explanation  


## Health Management

✅ Risk monitoring  
✅ Health diary  
✅ Emergency contacts  


## User Experience

✅ Responsive dashboard  
✅ Reusable components  
✅ Modular architecture  


---

# Folder Responsibility Summary


| Folder | Purpose |
|-|-|
| components | Reusable UI elements |
| pages | Complete screens |
| layouts | Application structure |
| routes | Navigation control |
| services | Backend communication |
| store | Global state management |
| assets | Images and static files |


---

# CardiShirt Frontend Summary


The frontend provides the complete user-facing interface for the CardiShirt AI ECG monitoring ecosystem.

It connects:

```
Wearable Device

        +

Backend API

        +

AI ECG Models

        +

User Interface

```

to deliver real-time cardiac monitoring and intelligent health insights.


# CardiShirt AI

AI-powered wearable ECG monitoring platform.