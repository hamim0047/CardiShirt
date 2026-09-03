import numpy as np
import neurokit2 as nk


def detect_r_peaks(
    signal: np.ndarray,
    fs: int,
) -> np.ndarray:
    """
    Detect ECG R-peaks.

    Parameters
    ----------
    signal:
        Preprocessed ECG signal.

    fs:
        Sampling frequency.

    Returns
    -------
    np.ndarray
        R-peak sample indices.
    """

    signal = np.asarray(
        signal,
        dtype=np.float64,
    )

    if signal.ndim != 1:
        raise ValueError(
            "detect_r_peaks expects a 1D ECG signal."
        )

    if len(signal) < fs:
        return np.array(
            [],
            dtype=np.int64,
        )

    try:

        _, info = nk.ecg_peaks(
            signal,
            sampling_rate=fs,
            method="neurokit",
        )

        peaks = info.get(
            "ECG_R_Peaks",
            [],
        )

        return np.asarray(
            peaks,
            dtype=np.int64,
        )

    except Exception as exc:

        print(
            f"Warning: R-peak detection failed: {exc}"
        )

        return np.array(
            [],
            dtype=np.int64,
        )