import os
import numpy as np
import wfdb

from scipy.signal import resample
from tqdm import tqdm



# =====================================================
# Paths
# =====================================================

PTBDB_DIR = "../data/ptbdb"

OUTPUT_DIR = "../data"



# =====================================================
# ECG settings
# =====================================================

TARGET_FS = 100

WINDOW_SECONDS = 5

WINDOW_SIZE = TARGET_FS * WINDOW_SECONDS



# =====================================================
# Label extraction
# =====================================================

def get_label(record_path):


    hea_file = record_path + ".hea"


    with open(
        hea_file,
        "r"
    ) as f:

        text = f.read().lower()



    # MI

    if "myocardial infarction" in text:

        return 1



    # Healthy control

    if "healthy control" in text:

        return 0



    return None




# =====================================================
# Load ECG
# =====================================================

def load_ecg(record_path):


    record = wfdb.rdrecord(
        record_path
    )


    signal = record.p_signal

    fs = record.fs


    return signal, fs




# =====================================================
# Main
# =====================================================

def main():


    print("="*60)

    print(
        "PTBDB BALANCED MI DATASET PREPARATION"
    )

    print("="*60)



    # -------------------------------------------------
    # Find records
    # -------------------------------------------------

    records = []


    for root, dirs, files in os.walk(
        PTBDB_DIR
    ):


        for file in files:


            if file.endswith(".hea"):


                path = os.path.join(

                    root,

                    file.replace(
                        ".hea",
                        ""
                    )

                )


                records.append(path)



    print(
        "Total records found:",
        len(records)
    )



    # Separate classes

    normal_signals = []

    mi_signals = []



    selected = 0



    # -------------------------------------------------
    # Process ECG
    # -------------------------------------------------

    for record_path in tqdm(records):


        label = get_label(
            record_path
        )


        if label is None:

            continue



        selected += 1



        try:

            ecg, fs = load_ecg(
                record_path
            )


        except Exception:

            continue



        # -------------------------------------------------
        # Lead II
        # -------------------------------------------------

        if ecg.shape[1] < 2:

            continue



        lead_ii = ecg[:,1]



        # -------------------------------------------------
        # Normalize
        # -------------------------------------------------

        lead_ii = (

            lead_ii

            -

            np.mean(lead_ii)

        ) / (

            np.std(lead_ii)

            +

            1e-8

        )



        # -------------------------------------------------
        # Resample
        # -------------------------------------------------

        if fs != TARGET_FS:


            new_length = int(

                len(lead_ii)

                *

                TARGET_FS

                /

                fs

            )


            lead_ii = resample(

                lead_ii,

                new_length

            )



        # -------------------------------------------------
        # 5 sec windows
        # -------------------------------------------------

        for start in range(

            0,

            len(lead_ii)-WINDOW_SIZE,

            WINDOW_SIZE

        ):


            segment = lead_ii[

                start:
                start + WINDOW_SIZE

            ]



            if len(segment) != WINDOW_SIZE:

                continue



            # (1,500)

            segment = np.expand_dims(

                segment.astype(
                    np.float32
                ),

                axis=0

            )



            if label == 0:

                normal_signals.append(
                    segment
                )


            else:

                mi_signals.append(
                    segment
                )




    # =================================================
    # Before balancing
    # =================================================

    print()

    print("="*60)

    print("Before balancing")

    print("="*60)


    print(
        "Normal samples:",
        len(normal_signals)
    )


    print(
        "MI samples:",
        len(mi_signals)
    )



    # =================================================
    # Balance classes
    # =================================================

    min_samples = min(

        len(normal_signals),

        len(mi_signals)

    )



    normal_signals = normal_signals[:min_samples]

    mi_signals = mi_signals[:min_samples]



    signals = (

        normal_signals

        +

        mi_signals

    )



    labels = (

        [0] * min_samples

        +

        [1] * min_samples

    )



    # =================================================
    # Shuffle
    # =================================================

    indices = np.random.permutation(

        len(labels)

    )



    signals = np.asarray(

        signals,

        dtype=np.float32

    )[indices]



    labels = np.asarray(

        labels,

        dtype=np.int64

    )[indices]




    # =================================================
    # Summary
    # =================================================

    print()

    print("="*60)

    print("FINAL DATASET SUMMARY")

    print("="*60)


    print(
        "Selected records:",
        selected
    )


    print(
        "Signals:",
        signals.shape
    )


    print(
        "Labels:",
        labels.shape
    )


    print()


    print(
        "Normal:",
        np.sum(labels==0)
    )


    print(
        "MI:",
        np.sum(labels==1)
    )




    # =================================================
    # Save
    # =================================================

    np.save(

        os.path.join(
            OUTPUT_DIR,
            "signals_mi.npy"
        ),

        signals

    )


    np.save(

        os.path.join(
            OUTPUT_DIR,
            "labels_mi.npy"
        ),

        labels

    )



    print()

    print(
        "Saved successfully"
    )





if __name__ == "__main__":

    main()