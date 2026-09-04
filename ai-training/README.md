# CardiShirt AI Training Pipeline

## AI-Based ECG Risk Screening System

CardiShirt AI is a deep learning-based ECG analysis pipeline designed for wearable cardiac monitoring.

The system receives ECG signals from a wearable device (ESP32 + ECG sensor), processes the ECG waveform, extracts physiological features, performs AI-based disease prediction, evaluates cardiac risk, and generates an understandable explanation.

The AI system provides:

- Arrhythmia detection
- Myocardial Infarction (MI) detection
- ECG signal quality assessment
- Heart rate calculation
- HRV analysis
- AI-based risk classification
- Explainable cardiac reports


# System Architecture


```
                 Wearable ECG Device
                         |
                         |
                       ESP32
                         |
                         |
                    ECG Signal
                         |
                         ↓

              =====================
                 CardiShirt AI
              =====================


                         |
                         ↓


              Layer 1:
          ECG Signal Processing


              |
              |
              ↓


              Layer 2:
              AI Models


        ---------------------------
        |                         |
        ↓                         ↓


 Arrhythmia Model              MI Model

 CNN + LSTM                   CNN + LSTM

 MIT-BIH                     PTBDB
 MIT-SV


        |
        |
        ↓


          Decision Engine


        |
        |
        ↓


          Layer 3:
      Explanation System


        |
        |
        ↓


      Final ECG Risk Report

```


# AI Pipeline Overview


CardiShirt AI follows a three-layer architecture.


```
Layer 1

ECG Signal Processing

- Filtering
- Noise removal
- R peak detection
- Heart rate calculation
- HRV calculation
- Signal quality checking


        ↓


Layer 2

AI Disease Prediction

- Arrhythmia Detection
- MI Detection
- Risk Decision


        ↓


Layer 3

Explainable AI

- Human readable report
- Clinical recommendation

```


---

# Layer 1: ECG Signal Processing


Location:

```
src/layer1/
```


Layer 1 converts raw ECG samples into meaningful cardiac information.


## Files


```
layer1/

├── filtering.py

├── peak_detection.py

├── features.py

├── morphology.py

├── signal_quality.py

└── pipeline.py

```


---

# ECG Filtering


File:

```
filtering.py
```


Purpose:

Remove ECG noise:

- Baseline drift
- High frequency noise
- Electrical interference


Process:


```
Raw ECG

   ↓

Filtering

   ↓

Clean ECG Signal

```


---

# R Peak Detection


File:

```
peak_detection.py
```


R peaks are detected to calculate:


- Heart rate
- RR interval
- HRV


Example:


```
      R          R          R

      /\         /\         /\

_____/  \_______/  \_______/  \____


RR1          RR2

```


---

# ECG Feature Extraction


File:

```
features.py
```


Extracted features:


| Feature | Description |
|---|---|
| Heart Rate | Beats per minute |
| RR Interval | Time between heartbeats |
| SDNN | HRV variation |
| RMSSD | Short term HRV |
| pNN50 | Heart rhythm variability |


---

# Signal Quality Checking


File:

```
signal_quality.py
```


Checks:

- Electrode connection
- Noise level
- Invalid ECG


Poor signals are classified as:


```
UNRELIABLE

```


---

# Layer 2: AI Prediction Models


Location:

```
src/layer2/
```


Layer 2 contains two separate deep learning models:


1. Arrhythmia Detection Model

2. Myocardial Infarction Detection Model


Separate models are used because arrhythmia and MI represent different cardiac conditions.


---

# CNN + LSTM Architecture


Both models use:


```
CNN + LSTM

```


## CNN


CNN learns local ECG waveform features:


- QRS morphology
- P wave
- T wave
- ST segment


Example:


```
ECG Signal

    ↓

CNN

    ↓

Waveform Features

```


---

## LSTM


LSTM learns temporal ECG patterns:


- Heartbeat sequence
- Rhythm changes
- RR relationship


Example:


```
Beat1 → Beat2 → Beat3 → Beat4


             LSTM

```


---

# Why CNN + LSTM?


ECG contains two important characteristics:


## Spatial Information

"What does one heartbeat look like?"

Handled by:

```
CNN
```


## Temporal Information

"How do heartbeats change over time?"

Handled by:

```
LSTM
```


Therefore:


```
CNN + LSTM

=

Morphology + Rhythm Understanding

```


---

# Arrhythmia Detection Model


Purpose:

Detect abnormal heart rhythm.


Output:


```
Normal

or

Abnormal

```


Model:

```
CNN + LSTM Binary Classifier

```


Model file:


```
data/ad8232_binary_arrhythmia_model.pt

```


---

# Arrhythmia Dataset


Datasets used:


```
MIT-BIH Arrhythmia Database

+

MIT Supraventricular Arrhythmia Database

```


Folder:


```
data/

├── mitdb/

└── svdb/

```


---

# Why MIT-BIH?


MIT-BIH is one of the most widely used ECG arrhythmia datasets.


It provides:


- ECG recordings
- Beat annotations
- Different rhythm abnormalities


Examples:

- Normal rhythm
- PVC
- PAC
- Bundle branch block


It is suitable because arrhythmia depends mainly on:

- Beat morphology
- Rhythm variation
- RR interval changes


---

# Why MIT-SV?


MIT-SV provides additional:


- Supraventricular arrhythmias
- Atrial rhythm abnormalities


Combining:


```
MIT-BIH + MIT-SV

```


creates better arrhythmia diversity.


---

# Myocardial Infarction Detection Model


Purpose:

Detect ECG patterns related to myocardial infarction.


Model:


```
CNN + LSTM Binary Classifier

```


Output:


```
Normal

or

MI

```


Model file:


```
data/mi_model.pt

```


---

# MI Dataset


Dataset:


```
PTB Diagnostic ECG Database

```


Folder:


```
data/

└── ptbdb/

```


---

# Why PTBDB?


PTBDB contains:


- Healthy control ECG
- Myocardial infarction ECG
- Clinically diagnosed cases


It contains MI-related ECG characteristics:


- ST changes
- Q wave abnormalities
- T wave changes


Therefore it is suitable for MI detection.


---

# Why Different Datasets?


Arrhythmia and MI are different problems.


Arrhythmia:

```
Electrical rhythm abnormality

```


MI:

```
Heart muscle damage / ischemia

```


They require different ECG patterns.


Therefore:


```
MIT-BIH + MIT-SV

        ↓

Arrhythmia Detection



PTBDB

        ↓

MI Detection

```


---

# Dataset Setup


Required folder structure:


```
ai-training

│
├── data
│
├── mitdb
│
├── svdb
│
└── ptbdb

```


---

# Dataset Download


## MIT-BIH


Download:

https://physionet.org/content/mitdb/


Place:


```
data/mitdb/

```


---

## MIT-SV


Download:

https://physionet.org/content/svdb/


Place:


```
data/svdb/

```


---

## PTBDB


Download:

https://physionet.org/content/ptbdb/


Place:


```
data/ptbdb/

```


---

# Installation


Create environment:


```bash
python -m venv venv
```


Activate:


Mac/Linux:

```bash
source venv/bin/activate
```


Install:


```bash
pip install -r requirements.txt
```


---

# Data Preparation


## Arrhythmia Dataset


Run:


```bash
python prepare_data.py
```


Creates:


```
signals.npy

labels.npy

```


---

## MI Dataset


Run:


```bash
python prepare_mi_data.py
```


Creates:


```
signals_mi.npy

labels_mi.npy

```


---

# Training Models


## Train Arrhythmia Model


Command:


```bash
python train.py
```


Output:


```
ecg_model.pt

```


---

## Train MI Model


Command:


```bash
python train_mi.py
```


Output:


```
mi_model.pt

```


---

# Model Evaluation


## Arrhythmia Evaluation


Run:


```bash
python evaluate.py
```


Generates:


```
confusion_matrix.png

roc_curve.png

```


---

## MI Evaluation


Run:


```bash
python evaluate_mi.py
```


Generates:


```
mi_confusion_matrix.png

mi_roc_curve.png

```


---

# AI Inference Pipeline


Main file:


```
src/services/inference.py

```


Process:


```
ECG Input

    ↓

Layer 1 Processing

    ↓

Arrhythmia CNN-LSTM

    ↓

MI CNN-LSTM

    ↓

Decision Engine

    ↓

Explanation Generator

```


---

# Layer 2 Decision Engine


Files:


```
decision_pipeline.py

rule_engine.py

```


Combines:


- AI predictions
- ECG features
- Signal quality


Outputs:


```
LOW

MODERATE

HIGH

CRITICAL

UNRELIABLE

```


---

# Layer 3 Explanation System


Location:


```
src/layer3/

```


Components:


```
gemini_explainer.py

groq_explainer.py

local_llm_explainer.py

```


Purpose:


Convert AI output into understandable reports.


Example:


```
Risk Level: HIGH

Possible cardiac abnormality detected.

Medical assessment recommended.

```


---

# Running AI API


Start:


```bash
python src/api/main.py
```


Endpoint:


```
POST /predict

```


Example:


```json
{
 "ecg":[0.12,0.15,0.18],
 "sampling_rate":250
}

```


Response:


```json
{
 "arrhythmia":"normal",
 "MI":"normal",
 "risk":"LOW"
}

```


---

# Project Structure


```
ai-training


├── data

│
├── mitdb

├── svdb

├── ptbdb


├── src


│
├── api

│   ├── main.py

│   └── schemas.py


│
├── layer1

│   ├── filtering.py

│   ├── peak_detection.py

│   ├── features.py

│   ├── morphology.py

│   └── signal_quality.py


│
├── layer2

│   ├── arrhythmia_inference.py

│   ├── mi_inference.py

│   ├── decision_pipeline.py

│   └── rule_engine.py


│
├── layer3

│   ├── explanation modules


│
├── services

│   └── inference.py


├── train.py

├── train_mi.py

├── evaluate.py

├── evaluate_mi.py


├── model.py

├── mi_model.py


└── requirements.txt

```


---

# Summary


CardiShirt AI combines:


✅ ECG signal processing  
✅ CNN-LSTM deep learning models  
✅ MIT-BIH + MIT-SV arrhythmia datasets  
✅ PTBDB MI dataset  
✅ Risk decision engine  
✅ Explainable AI  


The final system provides:


- Real-time ECG analysis
- Arrhythmia detection
- MI detection
- Wearable ECG compatibility
- Explainable cardiac risk screening


# CardiShirt AI

AI-powered wearable ECG monitoring system.
