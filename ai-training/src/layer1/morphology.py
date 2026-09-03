import numpy as np
import neurokit2 as nk


# =========================================================
# Helpers
# =========================================================

def _wave_array(
    waves: dict,
    key: str,
) -> np.ndarray:
    """
    Convert NeuroKit wave indices into float array.

    NaN values are preserved so beat alignment is not
    accidentally destroyed.
    """

    values = waves.get(
        key,
        [],
    )

    if values is None:
        return np.array(
            [],
            dtype=np.float64,
        )

    try:
        return np.asarray(
            values,
            dtype=np.float64,
        )

    except Exception:
        return np.array(
            [],
            dtype=np.float64,
        )


def _duration_pairs(
    starts: np.ndarray,
    ends: np.ndarray,
    fs: int,
    minimum_ms: float,
    maximum_ms: float,
):
    """
    Calculate durations while maintaining beat alignment.
    """

    measurements = []

    count = min(
        len(starts),
        len(ends),
    )

    for index in range(count):

        start = starts[index]
        end = ends[index]

        if (
            not np.isfinite(start)
            or not np.isfinite(end)
        ):
            continue

        if end <= start:
            continue

        duration_ms = (
            (end - start)
            / float(fs)
        ) * 1000.0

        if (
            minimum_ms
            <= duration_ms
            <= maximum_ms
        ):
            measurements.append(
                float(duration_ms)
            )

    return np.asarray(
        measurements,
        dtype=np.float32,
    )


def calculate_measurement_quality(
    measurement_count: int,
    total_beats: int,
    minimum_measurements: int = 5,
    minimum_coverage: float = 0.70,
):
    """
    Calculate technical measurement coverage.

    IMPORTANT:
    usable=True only means enough beat-level measurements
    were produced by the algorithm.

    It does NOT mean the measurement has been clinically
    validated or is safe for medical decision-making.
    """

    if total_beats <= 0:

        return {
            "measurementCount": 0,
            "totalBeats": 0,
            "coverage": 0.0,
            "coveragePercent": 0.0,
            "usable": False,
        }

    coverage = (
        measurement_count
        / float(total_beats)
    )

    usable = (
        measurement_count
        >= minimum_measurements
        and coverage
        >= minimum_coverage
    )

    return {
        "measurementCount": int(
            measurement_count
        ),

        "totalBeats": int(
            total_beats
        ),

        "coverage": float(
            coverage
        ),

        "coveragePercent": float(
            coverage * 100.0
        ),

        "usable": bool(
            usable
        ),
    }


# =========================================================
# ECG delineation
# =========================================================

def delineate_ecg(
    filtered_signal: np.ndarray,
    r_peaks: np.ndarray,
    fs: int,
):
    """
    Delineate ECG waveform landmarks using NeuroKit.

    Returns a dictionary containing available
    P/QRS/T landmarks.
    """

    signal = np.asarray(
        filtered_signal,
        dtype=np.float64,
    )

    r_peaks = np.asarray(
        r_peaks,
        dtype=np.int64,
    )

    if len(r_peaks) < 2:
        return {}

    try:

        _, waves = nk.ecg_delineate(
            signal,
            r_peaks=r_peaks,
            sampling_rate=fs,
            method="dwt",
            show=False,
            check=True,
        )

        return waves

    except Exception as exc:

        print(
            "Warning: ECG delineation failed: "
            f"{exc}"
        )

        return {}


# =========================================================
# R-wave amplitude
# =========================================================

def extract_r_amplitudes(
    filtered_signal: np.ndarray,
    r_peaks: np.ndarray,
):
    """
    Extract R-wave amplitudes from filtered,
    non-normalized ECG.

    Units are preserved from the input signal.

    For MIT-BIH p_signal this is normally mV.
    """

    signal = np.asarray(
        filtered_signal,
        dtype=np.float64,
    )

    r_peaks = np.asarray(
        r_peaks,
        dtype=np.int64,
    )

    valid_peaks = r_peaks[
        (r_peaks >= 0)
        &
        (r_peaks < len(signal))
    ]

    if len(valid_peaks) == 0:

        return np.array(
            [],
            dtype=np.float32,
        )

    amplitudes = signal[
        valid_peaks
    ]

    return amplitudes.astype(
        np.float32
    )


# =========================================================
# QRS duration
# =========================================================

def calculate_qrs_durations(
    waves: dict,
    fs: int,
):
    """
    Estimate QRS duration using:

        ECG_R_Onsets
            ->
        ECG_R_Offsets

    Measurements are returned in milliseconds.
    """

    onsets = _wave_array(
        waves,
        "ECG_R_Onsets",
    )

    offsets = _wave_array(
        waves,
        "ECG_R_Offsets",
    )

    return _duration_pairs(
        onsets,
        offsets,
        fs,
        minimum_ms=30.0,
        maximum_ms=250.0,
    )


# =========================================================
# QT interval
# =========================================================

def calculate_qt_intervals(
    waves: dict,
    fs: int,
):
    """
    Approximate QT interval using:

        QRS onset
            ->
        T-wave offset

    QRS onset is represented by ECG_R_Onsets.
    """

    qrs_onsets = _wave_array(
        waves,
        "ECG_R_Onsets",
    )

    t_offsets = _wave_array(
        waves,
        "ECG_T_Offsets",
    )

    return _duration_pairs(
        qrs_onsets,
        t_offsets,
        fs,
        minimum_ms=150.0,
        maximum_ms=700.0,
    )


# =========================================================
# QT correction
# =========================================================

def calculate_qtc(
    waves: dict,
    r_peaks: np.ndarray,
    fs: int,
):
    """
    Calculate approximate QTc using:

        Bazett
        Fridericia

    Returns
    -------
    tuple:
        qtc_bazett_ms
        qtc_fridericia_ms
    """

    qrs_onsets = _wave_array(
        waves,
        "ECG_R_Onsets",
    )

    t_offsets = _wave_array(
        waves,
        "ECG_T_Offsets",
    )

    r_peaks = np.asarray(
        r_peaks,
        dtype=np.float64,
    )

    qtc_bazett = []
    qtc_fridericia = []

    count = min(
        len(qrs_onsets),
        len(t_offsets),
        max(
            len(r_peaks) - 1,
            0,
        ),
    )

    for index in range(count):

        qrs_onset = qrs_onsets[
            index
        ]

        t_offset = t_offsets[
            index
        ]

        if (
            not np.isfinite(qrs_onset)
            or not np.isfinite(t_offset)
        ):
            continue

        if t_offset <= qrs_onset:
            continue

        qt_seconds = (
            t_offset
            - qrs_onset
        ) / float(fs)

        rr_seconds = (
            r_peaks[index + 1]
            - r_peaks[index]
        ) / float(fs)

        if (
            qt_seconds <= 0
            or rr_seconds <= 0
        ):
            continue

        qt_ms = (
            qt_seconds
            * 1000.0
        )

        # Technical sanity range only.
        if (
            qt_ms < 150.0
            or qt_ms > 700.0
        ):
            continue

        bazett_seconds = (
            qt_seconds
            / np.sqrt(
                rr_seconds
            )
        )

        fridericia_seconds = (
            qt_seconds
            / np.cbrt(
                rr_seconds
            )
        )

        qtc_bazett.append(
            bazett_seconds
            * 1000.0
        )

        qtc_fridericia.append(
            fridericia_seconds
            * 1000.0
        )

    return (
        np.asarray(
            qtc_bazett,
            dtype=np.float32,
        ),

        np.asarray(
            qtc_fridericia,
            dtype=np.float32,
        ),
    )


# =========================================================
# ST segment approximation
# =========================================================

def calculate_st_deviation(
    filtered_signal: np.ndarray,
    waves: dict,
    fs: int,
    st_offset_ms: float = 60.0,
):
    """
    Approximate ST amplitude relative to a local baseline.

    Measurement point:

        QRS offset + 60 ms

    Preferred baseline:

        P-wave offset -> QRS onset

    Fallback baseline:

        200 ms -> 80 ms before QRS onset

    Returned values use the same physical amplitude
    units as the input ECG.

    IMPORTANT:
    This is a prototype DSP feature and must not yet
    be treated as a clinical ST-elevation measurement.
    """

    signal = np.asarray(
        filtered_signal,
        dtype=np.float64,
    )

    r_onsets = _wave_array(
        waves,
        "ECG_R_Onsets",
    )

    r_offsets = _wave_array(
        waves,
        "ECG_R_Offsets",
    )

    p_offsets = _wave_array(
        waves,
        "ECG_P_Offsets",
    )

    st_samples_after_j = int(
        (
            st_offset_ms
            / 1000.0
        )
        * fs
    )

    deviations = []

    count = min(
        len(r_onsets),
        len(r_offsets),
    )

    for index in range(count):

        qrs_onset = r_onsets[
            index
        ]

        qrs_offset = r_offsets[
            index
        ]

        if (
            not np.isfinite(qrs_onset)
            or not np.isfinite(qrs_offset)
        ):
            continue

        qrs_onset = int(
            qrs_onset
        )

        qrs_offset = int(
            qrs_offset
        )

        # -------------------------------------------------
        # ST measurement point
        # -------------------------------------------------

        st_index = (
            qrs_offset
            + st_samples_after_j
        )

        if (
            st_index < 0
            or st_index >= len(signal)
        ):
            continue

        # -------------------------------------------------
        # Preferred PR-segment baseline
        # -------------------------------------------------

        baseline_start = None
        baseline_end = None

        if index < len(p_offsets):

            p_offset = p_offsets[
                index
            ]

            if (
                np.isfinite(p_offset)
                and p_offset < qrs_onset
            ):

                baseline_start = int(
                    p_offset
                )

                baseline_end = int(
                    qrs_onset
                )

        # -------------------------------------------------
        # Fallback baseline
        # -------------------------------------------------

        if (
            baseline_start is None
            or baseline_end is None
            or baseline_end
            - baseline_start
            < 3
        ):

            baseline_start = max(
                0,
                qrs_onset
                - int(
                    0.200
                    * fs
                ),
            )

            baseline_end = max(
                baseline_start,
                qrs_onset
                - int(
                    0.080
                    * fs
                ),
            )

        if (
            baseline_end
            <= baseline_start
        ):
            continue

        baseline_segment = signal[
            baseline_start:
            baseline_end
        ]

        if len(
            baseline_segment
        ) < 3:
            continue

        baseline = np.median(
            baseline_segment
        )

        st_value = signal[
            st_index
        ]

        deviation = (
            st_value
            - baseline
        )

        deviations.append(
            float(
                deviation
            )
        )

    return np.asarray(
        deviations,
        dtype=np.float32,
    )


# =========================================================
# Summary
# =========================================================

def summarize_morphology(
    filtered_signal: np.ndarray,
    r_peaks: np.ndarray,
    fs: int,
):
    """
    Complete prototype ECG morphology summary.

    Current outputs:
        R-wave amplitude
        QRS duration
        QT interval
        QTc Bazett
        QTc Fridericia
        approximate ST deviation

    Also provides technical measurement coverage
    and usability flags.
    """

    filtered_signal = np.asarray(
        filtered_signal,
        dtype=np.float64,
    )

    r_peaks = np.asarray(
        r_peaks,
        dtype=np.int64,
    )

    total_beats = len(
        r_peaks
    )

    # -----------------------------------------------------
    # Delineation
    # -----------------------------------------------------

    waves = delineate_ecg(
        filtered_signal,
        r_peaks,
        fs,
    )

    delineation_available = (
        len(waves) > 0
    )

    # -----------------------------------------------------
    # R amplitude
    # -----------------------------------------------------

    r_amplitudes = extract_r_amplitudes(
        filtered_signal,
        r_peaks,
    )

    # -----------------------------------------------------
    # QRS
    # -----------------------------------------------------

    qrs_durations = calculate_qrs_durations(
        waves,
        fs,
    )

    # -----------------------------------------------------
    # QT
    # -----------------------------------------------------

    qt_intervals = calculate_qt_intervals(
        waves,
        fs,
    )

    # -----------------------------------------------------
    # QTc
    # -----------------------------------------------------

    (
        qtc_bazett,
        qtc_fridericia,
    ) = calculate_qtc(
        waves,
        r_peaks,
        fs,
    )

    # -----------------------------------------------------
    # ST
    # -----------------------------------------------------

    st_deviations = calculate_st_deviation(
        filtered_signal,
        waves,
        fs,
    )

    # =====================================================
    # Measurement quality
    # =====================================================

    qrs_quality = calculate_measurement_quality(
        measurement_count=len(
            qrs_durations
        ),
        total_beats=total_beats,
        minimum_measurements=5,
        minimum_coverage=0.70,
    )

    qt_quality = calculate_measurement_quality(
        measurement_count=len(
            qt_intervals
        ),
        total_beats=total_beats,
        minimum_measurements=5,
        minimum_coverage=0.70,
    )

    qtc_measurement_count = min(
        len(qtc_bazett),
        len(qtc_fridericia),
    )

    qtc_quality = calculate_measurement_quality(
        measurement_count=qtc_measurement_count,
        total_beats=total_beats,
        minimum_measurements=5,
        minimum_coverage=0.70,
    )

    st_quality = calculate_measurement_quality(
        measurement_count=len(
            st_deviations
        ),
        total_beats=total_beats,
        minimum_measurements=5,
        minimum_coverage=0.70,
    )

    # =====================================================
    # Final result
    # =====================================================

    result = {
        # -------------------------------------------------
        # Delineation status
        # -------------------------------------------------

        "delineationAvailable": bool(
            delineation_available
        ),

        "delineationMethod": (
            "neurokit-dwt"
            if delineation_available
            else None
        ),

        "totalDetectedBeats": int(
            total_beats
        ),

        # -------------------------------------------------
        # R amplitude
        # -------------------------------------------------

        "meanRAmplitudeSignalUnits": None,
        "medianRAmplitudeSignalUnits": None,

        # -------------------------------------------------
        # QRS
        # -------------------------------------------------

        "meanQRSDurationMs": None,
        "medianQRSDurationMs": None,

        "qrsMeasurements": int(
            len(qrs_durations)
        ),

        "qrsQuality": qrs_quality,

        # -------------------------------------------------
        # QT
        # -------------------------------------------------

        "meanQTIntervalMs": None,
        "medianQTIntervalMs": None,

        "qtMeasurements": int(
            len(qt_intervals)
        ),

        "qtQuality": qt_quality,

        # -------------------------------------------------
        # QTc Bazett
        # -------------------------------------------------

        "meanQTcBazettMs": None,
        "medianQTcBazettMs": None,

        # -------------------------------------------------
        # QTc Fridericia
        # -------------------------------------------------

        "meanQTcFridericiaMs": None,
        "medianQTcFridericiaMs": None,

        "qtcMeasurements": int(
            qtc_measurement_count
        ),

        "qtcQuality": qtc_quality,

        # -------------------------------------------------
        # ST
        # -------------------------------------------------

        "meanSTDeviationSignalUnits": None,
        "medianSTDeviationSignalUnits": None,

        "stMeasurements": int(
            len(st_deviations)
        ),

        "stQuality": st_quality,
    }

    # =====================================================
    # R amplitude summary
    # =====================================================

    if len(r_amplitudes) > 0:

        result[
            "meanRAmplitudeSignalUnits"
        ] = float(
            np.mean(
                r_amplitudes
            )
        )

        result[
            "medianRAmplitudeSignalUnits"
        ] = float(
            np.median(
                r_amplitudes
            )
        )

    # =====================================================
    # QRS summary
    # =====================================================

    if len(qrs_durations) > 0:

        result[
            "meanQRSDurationMs"
        ] = float(
            np.mean(
                qrs_durations
            )
        )

        result[
            "medianQRSDurationMs"
        ] = float(
            np.median(
                qrs_durations
            )
        )

    # =====================================================
    # QT summary
    # =====================================================

    if len(qt_intervals) > 0:

        result[
            "meanQTIntervalMs"
        ] = float(
            np.mean(
                qt_intervals
            )
        )

        result[
            "medianQTIntervalMs"
        ] = float(
            np.median(
                qt_intervals
            )
        )

    # =====================================================
    # QTc Bazett summary
    # =====================================================

    if len(qtc_bazett) > 0:

        result[
            "meanQTcBazettMs"
        ] = float(
            np.mean(
                qtc_bazett
            )
        )

        result[
            "medianQTcBazettMs"
        ] = float(
            np.median(
                qtc_bazett
            )
        )

    # =====================================================
    # QTc Fridericia summary
    # =====================================================

    if len(qtc_fridericia) > 0:

        result[
            "meanQTcFridericiaMs"
        ] = float(
            np.mean(
                qtc_fridericia
            )
        )

        result[
            "medianQTcFridericiaMs"
        ] = float(
            np.median(
                qtc_fridericia
            )
        )

    # =====================================================
    # ST summary
    # =====================================================

    if len(st_deviations) > 0:

        result[
            "meanSTDeviationSignalUnits"
        ] = float(
            np.mean(
                st_deviations
            )
        )

        result[
            "medianSTDeviationSignalUnits"
        ] = float(
            np.median(
                st_deviations
            )
        )

    return result