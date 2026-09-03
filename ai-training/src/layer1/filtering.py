import numpy as np

from scipy.signal import (
    butter,
    filtfilt,
    iirnotch,
)


def bandpass_filter(
    signal: np.ndarray,
    fs: int,
    lowcut: float = 0.5,
    highcut: float = 40.0,
    order: int = 4,
) -> np.ndarray:
    """
    Butterworth ECG band-pass filter.

    Default:
        0.5 - 40 Hz
    """

    signal = np.asarray(
        signal,
        dtype=np.float64,
    )

    if signal.ndim != 1:
        raise ValueError(
            "bandpass_filter expects a 1D signal."
        )

    if fs <= 0:
        raise ValueError(
            "Sampling frequency must be positive."
        )

    nyquist = fs / 2.0

    effective_highcut = min(
        highcut,
        nyquist * 0.95,
    )

    if lowcut >= effective_highcut:
        return signal.copy()

    low = lowcut / nyquist
    high = effective_highcut / nyquist

    b, a = butter(
        order,
        [low, high],
        btype="bandpass",
    )

    minimum_length = (
        3
        * max(
            len(a),
            len(b),
        )
    )

    if len(signal) <= minimum_length:
        return signal.copy()

    return filtfilt(
        b,
        a,
        signal,
    )


def notch_filter(
    signal: np.ndarray,
    fs: int,
    powerline_frequency: float = 50.0,
    quality_factor: float = 30.0,
) -> np.ndarray:
    """
    Suppress power-line interference.
    """

    signal = np.asarray(
        signal,
        dtype=np.float64,
    )

    nyquist = fs / 2.0

    if powerline_frequency >= nyquist:
        return signal.copy()

    b, a = iirnotch(
        powerline_frequency,
        quality_factor,
        fs=fs,
    )

    minimum_length = (
        3
        * max(
            len(a),
            len(b),
        )
    )

    if len(signal) <= minimum_length:
        return signal.copy()

    return filtfilt(
        b,
        a,
        signal,
    )


def normalize_signal(
    signal: np.ndarray,
) -> np.ndarray:
    """
    Z-score normalization.
    """

    signal = np.asarray(
        signal,
        dtype=np.float64,
    )

    mean = np.mean(signal)
    std = np.std(signal)

    if std < 1e-8:
        return signal - mean

    return (
        signal - mean
    ) / std


def filter_lead(
    signal: np.ndarray,
    fs: int,
    powerline_frequency: float = 50.0,
) -> np.ndarray:
    """
    Filter ECG while preserving the original
    signal amplitude scale.

    Use this signal for morphology measurements.
    """

    signal = np.asarray(
        signal,
        dtype=np.float64,
    )

    filtered = bandpass_filter(
        signal,
        fs,
    )

    filtered = notch_filter(
        filtered,
        fs,
        powerline_frequency,
    )

    return filtered.astype(
        np.float32
    )


def preprocess_lead(
    signal: np.ndarray,
    fs: int,
    powerline_frequency: float = 50.0,
) -> np.ndarray:
    """
    Complete ECG preprocessing.

    Raw ECG
       ↓
    filtering
       ↓
    normalization

    Use this normalized result for peak detection
    and downstream ML input.
    """

    filtered = filter_lead(
        signal,
        fs,
        powerline_frequency,
    )

    processed = normalize_signal(
        filtered
    )

    return processed.astype(
        np.float32
    )