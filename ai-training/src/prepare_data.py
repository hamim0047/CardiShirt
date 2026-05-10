import os
import numpy as np
import wfdb

from config import MITDB_DIR, WINDOW_SIZE, STRIDE


def load_record(record_name: str):
    path = os.path.join(MITDB_DIR, record_name)
    record = wfdb.rdrecord(path)
    annotation = wfdb.rdann(path, "atr")
    return record, annotation


def ensure_three_channels(signal: np.ndarray) -> np.ndarray:
    # signal shape: (time, channels)
    channels = signal.shape[1]

    if channels >= 3:
      return signal[:, :3]

    if channels == 2:
        third = signal[:, 1:2]
        return np.concatenate([signal, third], axis=1)

    if channels == 1:
        return np.repeat(signal, 3, axis=1)

    raise ValueError("Signal has no channels")


def label_window(symbols):
    normal_symbols = {"N", "L", "R", "e", "j"}
    ventricular_symbols = {"V", "E"}
    atrial_symbols = {"A", "a", "J", "S"}

    if all(sym in normal_symbols for sym in symbols):
        return 0  # normal
    elif any(sym in ventricular_symbols for sym in symbols):
        return 1  # ventricular
    elif any(sym in atrial_symbols for sym in symbols):
        return 2  # atrial
    else:
        return 3  # other abnormal


def build_windows(record_name: str):
    record, ann = load_record(record_name)

    signal = record.p_signal
    signal = ensure_three_channels(signal)

    # normalize per channel
    signal = (signal - signal.mean(axis=0)) / (signal.std(axis=0) + 1e-8)

    windows = []
    labels = []

    for start in range(0, len(signal) - WINDOW_SIZE, STRIDE):
        end = start + WINDOW_SIZE
        chunk = signal[start:end]  # (time, channels)

        beat_idx = np.where((ann.sample >= start) & (ann.sample < end))[0]
        if len(beat_idx) == 0:
            continue

        symbols = [ann.symbol[i] for i in beat_idx]
        label = label_window(symbols)

        # transpose -> (channels, time)
        chunk = chunk.T.astype(np.float32)

        windows.append(chunk)
        labels.append(label)

    return windows, labels


if __name__ == "__main__":
    records = [
        "100", "101", "102", "103", "105", "106", "107", "108",
        "109", "111", "112", "113", "114", "115", "116", "117",
        "118", "119", "121", "122", "123", "124"
    ]

    all_x, all_y = [], []

    for rec in records:
        x, y = build_windows(rec)
        all_x.extend(x)
        all_y.extend(y)
        print(f"{rec}: {len(x)} windows")

    signals = np.array(all_x, dtype=np.float32)
    labels = np.array(all_y, dtype=np.int64)

    os.makedirs("../data", exist_ok=True)
    np.save("../data/signals.npy", signals)
    np.save("../data/labels.npy", labels)

    print(f"Saved {len(signals)} windows.")
    print(f"Signals shape: {signals.shape}")
    print(f"Labels shape: {labels.shape}")