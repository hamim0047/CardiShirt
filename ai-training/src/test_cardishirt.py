import wfdb

from layer1.pipeline import extract_ecg_features

from layer2.decision_pipeline import CardiShirtDecision



# ==========================================
# Load ECG
# ==========================================

record = wfdb.rdrecord(
    "../data/mitdb/100"
)


signal = record.p_signal[:,0]


fs = int(record.fs)



print("="*60)
print("CARDISHIRT COMPLETE SYSTEM TEST")
print("="*60)



# ==========================================
# Layer 1
# ==========================================

print("\nRunning Layer 1...")


layer1_output = extract_ecg_features(

    signal,

    fs

)


print("Layer 1 Completed")

print(
    "Heart Rate:",
    layer1_output["heartRate"]
)



# ==========================================
# Layer 2
# ==========================================

print("\nRunning Layer 2...")


system = CardiShirtDecision()


result = system.analyze(

    layer1_output

)



print("\n==============================")

print("ARRHYTHMIA RESULT")

print("==============================")

print(
    result["arrhythmia"]
)



print("\n==============================")

print("MI RESULT")

print("==============================")

print(
    result["MI"]
)



print("\n==============================")

print("FINAL RISK")

print("==============================")

print(
    result["decision"]
)