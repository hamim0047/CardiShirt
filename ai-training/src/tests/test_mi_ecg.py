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


RECORD_PATH = "../data/ptbdb/patient012/s0043lre"



print("="*60)
print("TEST: MI ECG")
print("="*60)



record = wfdb.rdrecord(

    RECORD_PATH

)



signal = record.p_signal[:,1]


fs = int(record.fs)



layer1_output = extract_ecg_features(

    signal,

    fs

)



print(
    "Heart Rate:",
    layer1_output["heartRate"]
)



system = CardiShirtDecision()



result = system.analyze(

    layer1_output

)



print("\nARRHYTHMIA")

print(
    result["arrhythmia"]
)



print("\nMI")

print(
    result["MI"]
)



print("\nFINAL RISK")

print(
    result["decision"]
)