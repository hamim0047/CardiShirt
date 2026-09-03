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


from cardishirt_pipeline import CardiShirtPipeline




# ===================================
# ECG TEST RECORD
# ===================================


RECORD_PATH = "../data/ptbdb/patient229/s0453_re"




print("="*60)

print("CARDISHIRT FULL PIPELINE TEST")

print("="*60)




record = wfdb.rdrecord(

    RECORD_PATH

)



signal = record.p_signal[:,1]


fs = int(record.fs)




print(

    "Sampling Rate:",

    fs

)



print(

    "Signal Length:",

    len(signal)

)




# ===================================
# RUN SYSTEM
# ===================================


system = CardiShirtPipeline()



result = system.analyze(

    signal,

    fs

)





# ===================================
# LAYER 1 OUTPUT
# ===================================


print("\n")

print("="*60)

print("LAYER 1 OUTPUT")

print("="*60)


print(

    "Heart Rate:",

    result["layer1"]["heartRate"]

)





# ===================================
# LAYER 2 OUTPUT
# ===================================


print("\n")

print("="*60)

print("LAYER 2 OUTPUT")

print("="*60)



print(

    "Arrhythmia:"

)

print(

    result["layer2"]["arrhythmia"]

)



print(

    "MI:"

)

print(

    result["layer2"]["MI"]

)



print(

    "Risk:"

)

print(

    result["layer2"]["decision"]

)






# ===================================
# LAYER 3 OUTPUT
# ===================================


print("\n")

print("="*60)

print("LAYER 3 GEMINI EXPLANATION")

print("="*60)



print(

    result["layer3"]["explanation"]

)



print("\nDONE")