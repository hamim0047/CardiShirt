import numpy as np


def signal_quality_flags(
    signal: np.ndarray,
):
    """
    Perform basic technical ECG signal-quality checks.

    Returns
    -------
    list[str]

    Example:
        []
        ["FLAT_SIGNAL"]
        ["NAN_VALUES", "POSSIBLE_CLIPPING"]
    """

    signal = np.asarray(
        signal,
        dtype=np.float64,
    )

    flags = []

    # -----------------------------------------------------
    # Empty signal
    # -----------------------------------------------------

    if len(signal) == 0:

        flags.append(
            "EMPTY_SIGNAL"
        )

        return flags

    # -----------------------------------------------------
    # NaN values
    # -----------------------------------------------------

    if np.isnan(
        signal
    ).any():

        flags.append(
            "NAN_VALUES"
        )

    # -----------------------------------------------------
    # Infinite values
    # -----------------------------------------------------

    if np.isinf(
        signal
    ).any():

        flags.append(
            "INFINITE_VALUES"
        )

    finite_signal = signal[
        np.isfinite(
            signal
        )
    ]

    if len(
        finite_signal
    ) == 0:

        return flags

    # -----------------------------------------------------
    # Flat signal
    # -----------------------------------------------------

    standard_deviation = np.std(
        finite_signal
    )

    if (
        standard_deviation
        < 1e-6
    ):

        flags.append(
            "FLAT_SIGNAL"
        )

    # -----------------------------------------------------
    # Possible clipping
    # -----------------------------------------------------

    signal_min = np.min(
        finite_signal
    )

    signal_max = np.max(
        finite_signal
    )

    near_min = np.isclose(
        finite_signal,
        signal_min,
    )

    near_max = np.isclose(
        finite_signal,
        signal_max,
    )

    clipping_ratio = np.mean(
        near_min
        |
        near_max
    )

    if (
        clipping_ratio
        > 0.05
    ):

        flags.append(
            "POSSIBLE_CLIPPING"
        )

    return flags