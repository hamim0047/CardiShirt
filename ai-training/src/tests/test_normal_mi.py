import sys
import os

sys.path.append(
    os.path.dirname(
        os.path.dirname(
            os.path.abspath(__file__)
        )
    )
)

import wfdb

from layer1.pipeline import extract_ecg_features
from layer2.decision_pipeline import CardiShirtDecision



RECORD_PATH = "../data/ptbdb/patient229/s0453_re"



print("="*60)
print("PTBDB NORMAL CONTROL TEST")
print("="*60)



record = wfdb.rdrecord(
    RECORD_PATH
)


signal = record.p_signal[:,1]

fs = int(record.fs)



print("Sampling rate:", fs)
print("Signal length:", len(signal))



# -----------------------------
# Layer 1
# -----------------------------

layer1_output = extract_ecg_features(

    signal,

    fs

)



print(
    "Heart Rate:",
    layer1_output["heartRate"]
)



# -----------------------------
# Layer 2
# -----------------------------

system = CardiShirtDecision()


result = system.analyze(

    layer1_output

)



print("\nARRHYTHMIA")
print(result["arrhythmia"])



print("\nMI")
print(result["MI"])



print("\nFINAL")
print(result["decision"])