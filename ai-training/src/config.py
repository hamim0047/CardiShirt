DATA_DIR = "../data"


# =========================================================
# ECG Databases
# =========================================================

MITDB_DIR = "../data/mitdb"

SVDB_DIR = "../data/svdb"



# =========================================================
# ECG Sampling
# =========================================================

MODEL_SAMPLE_RATE = 360



# =========================================================
# Arrhythmia Model Input
# =========================================================

# AD8232:
# Single lead ECG
#
# Input shape:
# (channels, samples)
#
# (1,720)

MODEL_WINDOW_SECONDS = 2


WINDOW_SIZE = (
    MODEL_SAMPLE_RATE
    *
    MODEL_WINDOW_SECONDS
)


# Not used
# Beat-centered dataset

STRIDE = None



# =========================================================
# Layer-1 Feature Extraction
# =========================================================

FEATURE_WINDOW_SECONDS = 30


# HRV requires longer ECG

HRV_WINDOW_SECONDS = 300



# =========================================================
# Training
# =========================================================

BATCH_SIZE = 128

EPOCHS = 30

LEARNING_RATE = 1e-4



# =========================================================
# Classes
# =========================================================

# Binary Arrhythmia Screening

NUM_CLASSES = 2


CLASS_NAMES = [
    "normal",
    "abnormal",
]



# =========================================================
# Model Paths
# =========================================================

MODEL_PATH = (
    "../data/ad8232_binary_arrhythmia_model.pt"
)


SCRIPTED_MODEL_PATH = (
    "../data/ad8232_binary_arrhythmia_model_scripted.pt"
)