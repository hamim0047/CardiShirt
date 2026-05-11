# CARDI-SHIRT
## Hybrid AI Powered Real-Time Cardiac Monitoring System

CARDI-SHIRT is an AI-powered smart cardiac monitoring system designed to continuously monitor ECG signals in real time using a smart wearable shirt. The system combines ECG sensing, activity tracking, machine learning, rule-based analysis, and AI explanations to help detect abnormal heart conditions and provide understandable health insights.

---

# 📌 Features

- Real-time ECG monitoring
- Smart Shirt ECG integration
- ESP32-based data collection
- Activity tracking support
- Arrhythmia detection
- Possible myocardial infarction (MI) risk detection
- Hybrid AI + Rule-Based decision system
- AI-generated explanations and alerts
- Emergency workflow support
- Real-time dashboard and reports

---

# 🧠 System Architecture

The system follows a **3-Layer AI Architecture**.

## 1️⃣ Layer 1: Preprocessing & Feature Extraction

This layer processes raw ECG signals and extracts important cardiac features.

### Extracted Features
- Heart Rate (BPM)
- RR Intervals
- HRV Metrics
- ECG Morphology Features
- Signal Anomaly Flags

### Technologies Used
- Digital Signal Processing (DSP)
- Heuristic Algorithms
- Peak Detection Algorithms

---

## 2️⃣ Layer 2: Hybrid Decision Engine

The main intelligence layer combining:

### Machine Learning Models
- Arrhythmia Detection Model
- MI Detection Model

### Rule-Based System
The rule engine combines:
- ML outputs
- ECG metrics
- Risk thresholds
- Medical logic rules

### Risk Levels
- LOW
- HIGH
- CRITICAL

---

## 3️⃣ Layer 3: AI Explanation & Communication

Powered by Gemini AI.

### Responsibilities
- Explain findings in simple language
- Generate risk summaries
- Answer user questions
- Generate alerts

> ⚠️ This layer does NOT make medical decisions.

---

# 🚨 Emergency Workflow

If critical abnormalities are detected:
- Emergency protocol is triggered
- Alerts are generated
- Emergency status is updated
- Reports can be shared with doctors

---

# 📊 Dashboard Features

- Live ECG waveform
- Heart rate trends
- HRV trends
- Active alerts
- AI summaries
- Emergency status monitoring

---

# 🔒 Privacy & Security

- Encrypted user data
- Secure cloud processing
- User consent required
- Protected medical information handling

---

# 🛠️ Technologies Used

## Hardware
- Smart ECG Shirt
- ESP32 Module
- ECG Sensors
- Accelerometer Sensors

## Software
- Python
- FastAPI
- PostgreSQL
- Prisma ORM

## AI & ML
- Machine Learning Models
- Gemini AI
- Signal Processing Algorithms

---

# 📂 Future Improvements

- Mobile app integration
- Doctor appointment support
- Advanced prediction models
- Multi-user dashboard
- Real-time hospital notification system

---

# ⚠️ Disclaimer

CARDI-SHIRT is an assistive AI monitoring system and should not replace professional medical diagnosis or emergency medical services.

---

# 👨‍💻 Project Goal

The goal of CARDI-SHIRT is to provide accessible, intelligent, and real-time cardiac monitoring that helps users detect potential heart-related risks earlier and understand their cardiac condition more clearly.
