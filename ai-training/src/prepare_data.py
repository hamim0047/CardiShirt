import os
import numpy as np
import wfdb

from config import (
    MITDB_DIR,
    SVDB_DIR,
    WINDOW_SIZE,
)


# =========================================================
# MIT-BIH Arrhythmia Records
# =========================================================

MITDB_RECORDS = [
    "100", "101", "102", "103", "104",
    "105", "106", "107", "108", "109",
    "111", "112", "113", "114", "115",
    "116", "117", "118", "119", "121",
    "122", "123", "124",
    "200", "201", "202", "203",
    "205", "207", "208", "209",
    "210", "212", "213", "214",
    "215", "217", "219", "220",
    "221", "222", "223",
    "228", "230", "231",
    "232", "233", "234"
]


# =========================================================
# MIT-BIH Supraventricular Records
# =========================================================

SVDB_RECORDS = [
    "800",
    "801",
    "802",
    "803",
    "804",
    "805",
    "806",
    "807",
    "808",
    "809",
    "811",
    "820",
    "821",
    "822",
    "828",
]


# =========================================================
# Beat Labels
# =========================================================

NORMAL_SYMBOLS = {
    "N",
    "L",
    "R",
    "e",
    "j",
}


ABNORMAL_SYMBOLS = {

    # ventricular
    "V",
    "E",
    "F",

    # atrial
    "A",
    "a",
    "J",
    "S",

    # other
    "Q",
    "+",
    "~",
    "!",
    '"',
    "|",
    "x",
    "[",
    "]",
}


VALID_SYMBOLS = (
    NORMAL_SYMBOLS
    |
    ABNORMAL_SYMBOLS
)



# =========================================================
# Load ECG record
# =========================================================

def load_record(
    record_name,
    database
):

    if database == "mitdb":

        folder = MITDB_DIR

    elif database == "svdb":

        folder = SVDB_DIR

    else:

        raise ValueError(
            "Unknown database"
        )


    path = os.path.join(
        folder,
        record_name
    )


    record = wfdb.rdrecord(
        path
    )


    annotation = wfdb.rdann(
        path,
        "atr"
    )


    return record, annotation



# =========================================================
# Convert to AD8232 single lead
# =========================================================

def get_single_channel(signal):

    """
    AD8232 gives one ECG channel.

    Use first channel:
    MIT-BIH MLII
    """

    if signal.ndim == 2:

        signal = signal[:,0]


    return signal



# =========================================================
# Binary labeling
# =========================================================

def convert_label(symbol):

    if symbol in NORMAL_SYMBOLS:

        return 0


    elif symbol in ABNORMAL_SYMBOLS:

        return 1


    return None



# =========================================================
# Process one record
# =========================================================

def process_record(
    record_name,
    database
):


    record, annotation = load_record(
        record_name,
        database
    )


    signal = get_single_channel(
        record.p_signal
    )


    # Normalize

    signal = (
        signal -
        signal.mean()
    ) / (
        signal.std()
        +
        1e-8
    )


    X = []
    y = []


    half = WINDOW_SIZE // 2



    for i, sample in enumerate(
        annotation.sample
    ):


        symbol = annotation.symbol[i]


        if symbol not in VALID_SYMBOLS:

            continue



        label = convert_label(
            symbol
        )


        if label is None:

            continue



        start = sample - half
        end = sample + half



        if start < 0:

            continue


        if end >= len(signal):

            continue



        beat = signal[
            start:end
        ]



        if len(beat) != WINDOW_SIZE:

            continue



        # (720,)
        # ->
        # (1,720)

        beat = np.expand_dims(
            beat,
            axis=0
        )


        X.append(
            beat.astype(
                np.float32
            )
        )


        y.append(
            label
        )



    return X, y



# =========================================================
# Build combined dataset
# =========================================================

def build_dataset():

    X = []
    y = []


    print("="*60)
    print("Processing MIT-BIH")
    print("="*60)



    for record in MITDB_RECORDS:


        try:

            x, labels = process_record(
                record,
                "mitdb"
            )


            X.extend(x)
            y.extend(labels)


            print(
                record,
                "samples:",
                len(x)
            )


        except Exception as e:

            print(
                "Skipped",
                record,
                e
            )



    print()
    print("="*60)
    print("Processing SVDB")
    print("="*60)



    for record in SVDB_RECORDS:


        try:

            x, labels = process_record(
                record,
                "svdb"
            )


            X.extend(x)
            y.extend(labels)


            print(
                record,
                "samples:",
                len(x)
            )


        except Exception as e:

            print(
                "Skipped",
                record,
                e
            )



    X = np.asarray(
        X,
        dtype=np.float32
    )


    y = np.asarray(
        y,
        dtype=np.int64
    )


    return X, y



# =========================================================
# Save
# =========================================================

def save_dataset(
    X,
    y
):


    os.makedirs(
        "../data",
        exist_ok=True
    )


    np.save(
        "../data/signals_combined.npy",
        X
    )


    np.save(
        "../data/labels_combined.npy",
        y
    )


    print()
    print("="*60)
    print("DATASET COMPLETE")
    print("="*60)


    print(
        "Signals:",
        X.shape
    )


    print(
        "Labels:",
        y.shape
    )


    print(
        "Normal:",
        np.sum(y==0)
    )


    print(
        "Abnormal:",
        np.sum(y==1)
    )



# =========================================================
# Main
# =========================================================

def main():


    X, y = build_dataset()


    save_dataset(
        X,
        y
    )



if __name__ == "__main__":

    main()