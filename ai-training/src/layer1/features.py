import numpy as np


def calculate_rr_intervals(
    r_peaks: np.ndarray,
    fs: int,
) -> np.ndarray:
    """
    Calculate RR intervals from consecutive R-peaks.

    Returns
    -------
    milliseconds
    """

    r_peaks = np.asarray(
        r_peaks,
        dtype=np.int64,
    )

    if len(r_peaks) < 2:

        return np.array(
            [],
            dtype=np.float32,
        )

    rr_samples = np.diff(
        r_peaks
    )

    rr_ms = (
        rr_samples
        / float(fs)
    ) * 1000.0

    return rr_ms.astype(
        np.float32
    )


def clean_rr_intervals(
    rr_intervals_ms: np.ndarray,
) -> np.ndarray:
    """
    Remove obviously implausible RR intervals.

    This is technical artifact filtering,
    not a diagnostic rule.
    """

    rr = np.asarray(
        rr_intervals_ms,
        dtype=np.float64,
    )

    if len(rr) == 0:
        return rr

    valid = (
        (rr >= 250.0)
        &
        (rr <= 2500.0)
    )

    return rr[
        valid
    ]


def calculate_heart_rate(
    rr_intervals_ms: np.ndarray,
):
    """
    Calculate mean heart rate in BPM.
    """

    rr = clean_rr_intervals(
        rr_intervals_ms
    )

    if len(rr) == 0:
        return None

    mean_rr = np.mean(
        rr
    )

    if mean_rr <= 0:
        return None

    heart_rate = (
        60000.0
        / mean_rr
    )

    return float(
        heart_rate
    )


def calculate_hrv(
    rr_intervals_ms: np.ndarray,
):
    """
    Calculate basic time-domain HRV metrics.

    Metrics:
        mean RR
        SDNN
        RMSSD
        pNN50
    """

    rr = clean_rr_intervals(
        rr_intervals_ms
    )

    result = {
        "meanRR": None,
        "sdnn": None,
        "rmssd": None,
        "pnn50": None,
    }

    if len(rr) < 3:
        return result

    # -----------------------------------------------------
    # Mean RR
    # -----------------------------------------------------

    mean_rr = np.mean(
        rr
    )

    # -----------------------------------------------------
    # SDNN
    # -----------------------------------------------------

    sdnn = np.std(
        rr,
        ddof=1,
    )

    # -----------------------------------------------------
    # Successive RR differences
    # -----------------------------------------------------

    rr_differences = np.diff(
        rr
    )

    if len(
        rr_differences
    ) == 0:

        return result

    # -----------------------------------------------------
    # RMSSD
    # -----------------------------------------------------

    rmssd = np.sqrt(
        np.mean(
            rr_differences ** 2
        )
    )

    # -----------------------------------------------------
    # pNN50
    # -----------------------------------------------------

    nn50 = np.sum(
        np.abs(
            rr_differences
        )
        > 50.0
    )

    pnn50 = (
        nn50
        / len(
            rr_differences
        )
    ) * 100.0

    result[
        "meanRR"
    ] = float(
        mean_rr
    )

    result[
        "sdnn"
    ] = float(
        sdnn
    )

    result[
        "rmssd"
    ] = float(
        rmssd
    )

    result[
        "pnn50"
    ] = float(
        pnn50
    )

    return result