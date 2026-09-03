import numpy as np

from .filtering import (
    filter_lead,
    preprocess_lead,
)

from .peak_detection import (
    detect_r_peaks,
)

from .features import (
    calculate_rr_intervals,
    calculate_heart_rate,
    calculate_hrv,
)

from .signal_quality import (
    signal_quality_flags,
)

from .morphology import (
    summarize_morphology,
)


# =========================================================
# Single-lead processing
# =========================================================

def extract_ecg_features(
    signal: np.ndarray,
    fs: int,
):
    """
    Complete Layer-1 feature extraction for one ECG lead.
    """

    signal = np.asarray(
        signal,
        dtype=np.float32,
    )

    if signal.ndim != 1:
        raise ValueError(
            f"Expected 1D ECG signal. "
            f"Received {signal.shape}"
        )

    if len(signal) == 0:
        raise ValueError(
            "ECG signal is empty."
        )

    if fs <= 0:
        raise ValueError(
            "Sampling frequency must be positive."
        )

    # =====================================================
    # Raw signal quality
    # =====================================================

    quality_flags = signal_quality_flags(
        signal
    )

    # =====================================================
    # Scale-preserving filtered ECG
    #
    # Morphology uses this.
    # =====================================================

    filtered_signal = filter_lead(
        signal,
        fs,
    )

    # =====================================================
    # Filtered + normalized ECG
    #
    # Peak detection and ML use this.
    # =====================================================

    processed_signal = preprocess_lead(
        signal,
        fs,
    )

    # =====================================================
    # R peaks
    # =====================================================

    r_peaks = detect_r_peaks(
        processed_signal,
        fs,
    )

    # =====================================================
    # RR intervals
    # =====================================================

    rr_intervals = calculate_rr_intervals(
        r_peaks,
        fs,
    )

    # =====================================================
    # Heart rate
    # =====================================================

    heart_rate = calculate_heart_rate(
        rr_intervals
    )

    # =====================================================
    # HRV
    # =====================================================

    hrv = calculate_hrv(
        rr_intervals
    )

    # =====================================================
    # Morphology
    #
    # IMPORTANT:
    # Uses filtered non-normalized signal.
    # =====================================================

    morphology = summarize_morphology(
        filtered_signal,
        r_peaks,
        fs,
    )

    # =====================================================
    # Duration
    # =====================================================

    duration_seconds = (
        len(signal)
        / float(fs)
    )

    # Data sufficiency indicator only.
    hrv_data_sufficient = (
        duration_seconds >= 60.0
        and len(rr_intervals) >= 30
    )

    # =====================================================
    # Result
    # =====================================================

    return {
        "durationSeconds": float(
            duration_seconds
        ),

        "heartRate": heart_rate,

        "rPeakCount": int(
            len(r_peaks)
        ),

        "rPeaks": (
            r_peaks.tolist()
        ),

        "rrIntervalsMs": (
            rr_intervals.tolist()
        ),

        "hrv": hrv,

        "hrvDataSufficient": bool(
            hrv_data_sufficient
        ),

        "morphology": morphology,

        "signalQualityFlags": (
            quality_flags
        ),

        # Normalized ECG for ML use
        "processedSignal": (
            processed_signal.tolist()
        ),
    }


# =========================================================
# CardiShirt three-lead pipeline
# =========================================================

def extract_three_lead_features(
    lead1,
    lead2,
    lead3,
    fs: int,
    primary_lead_index: int = 1,
):
    """
    Complete Layer-1 processing for three ECG leads.

    All leads:
        signal quality
        preprocessing

    Primary lead:
        R peaks
        RR
        heart rate
        HRV
        morphology
    """

    if primary_lead_index not in (
        0,
        1,
        2,
    ):
        raise ValueError(
            "primary_lead_index must be 0, 1 or 2."
        )

    leads = [
        np.asarray(
            lead1,
            dtype=np.float32,
        ),

        np.asarray(
            lead2,
            dtype=np.float32,
        ),

        np.asarray(
            lead3,
            dtype=np.float32,
        ),
    ]

    # =====================================================
    # Validation
    # =====================================================

    for index, lead in enumerate(
        leads
    ):

        if lead.ndim != 1:
            raise ValueError(
                f"Lead {index + 1} must be 1D. "
                f"Received {lead.shape}"
            )

        if len(lead) == 0:
            raise ValueError(
                f"Lead {index + 1} is empty."
            )

    lengths = [
        len(lead)
        for lead in leads
    ]

    if len(set(lengths)) != 1:
        raise ValueError(
            "All ECG leads must have the same length. "
            f"Received: {lengths}"
        )

    # =====================================================
    # Quality checks
    # =====================================================

    quality_results = []

    for lead in leads:

        flags = signal_quality_flags(
            lead
        )

        quality_results.append(
            {
                "valid": (
                    len(flags)
                    == 0
                ),
                "flags": flags,
            }
        )

    # =====================================================
    # Primary lead physiological features
    # =====================================================

    primary_features = extract_ecg_features(
        leads[
            primary_lead_index
        ],
        fs,
    )

    # =====================================================
    # Normalized outputs for ML models
    # =====================================================

    processed_leads = []

    for lead in leads:

        processed = preprocess_lead(
            lead,
            fs,
        )

        processed_leads.append(
            processed.tolist()
        )

    # =====================================================
    # Final Layer-1 output
    # =====================================================

    return {
        "durationSeconds": (
            primary_features[
                "durationSeconds"
            ]
        ),

        "primaryLead": (
            primary_lead_index + 1
        ),

        "heartRate": (
            primary_features[
                "heartRate"
            ]
        ),

        "rPeakCount": (
            primary_features[
                "rPeakCount"
            ]
        ),

        "rPeaks": (
            primary_features[
                "rPeaks"
            ]
        ),

        "rrIntervalsMs": (
            primary_features[
                "rrIntervalsMs"
            ]
        ),

        "hrv": (
            primary_features[
                "hrv"
            ]
        ),

        "hrvDataSufficient": (
            primary_features[
                "hrvDataSufficient"
            ]
        ),

        "morphology": (
            primary_features[
                "morphology"
            ]
        ),

        "leadQuality": {
            "lead1": quality_results[0],
            "lead2": quality_results[1],
            "lead3": quality_results[2],
        },

        "processedLeads": {
            "lead1": processed_leads[0],
            "lead2": processed_leads[1],
            "lead3": processed_leads[2],
        },
    }