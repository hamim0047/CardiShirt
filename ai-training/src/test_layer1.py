import os
import json
import warnings

import wfdb

from pandas.errors import SettingWithCopyWarning

# =========================================================
# Suppress NeuroKit / pandas compatibility warnings
# =========================================================

warnings.filterwarnings(
    "ignore",
    category=SettingWithCopyWarning,
    module=r"neurokit2\..*",
)

warnings.filterwarnings(
    "ignore",
    category=FutureWarning,
    module=r"neurokit2\..*",
)

from config import (
    MITDB_DIR,
)

from layer1.pipeline import (
    extract_three_lead_features,
)


def main():

    # =====================================================
    # Test configuration
    # =====================================================

    RECORD_NAME = "100"

    TEST_DURATION_SECONDS = 60

    PRIMARY_LEAD_INDEX = 1

    # =====================================================
    # Load MIT-BIH record
    # =====================================================

    record_path = os.path.join(
        MITDB_DIR,
        RECORD_NAME,
    )

    record = wfdb.rdrecord(
        record_path
    )

    signal = record.p_signal

    fs = int(
        record.fs
    )

    print()
    print("=" * 70)
    print("CardiShirt Layer-1 Test")
    print("=" * 70)

    print(
        f"MIT-BIH record: "
        f"{RECORD_NAME}"
    )

    print(
        f"Sampling frequency: "
        f"{fs} Hz"
    )

    print(
        f"Original signal shape: "
        f"{signal.shape}"
    )

    print(
    f"Signal names: "
    f"{record.sig_name}"
    )
    print(
    f"Signal units: "
    f"{record.units}"
    )

    # =====================================================
    # MIT-BIH normally has two channels.
    #
    # For this software test only:
    #
    # lead1 = channel 1
    # lead2 = channel 2
    # lead3 = duplicate of channel 2
    #
    # This validates the 3-input software pipeline only.
    # It does NOT represent the final CardiShirt hardware
    # lead configuration.
    # =====================================================

    if signal.ndim != 2:

        raise ValueError(
            f"Expected 2D ECG signal. "
            f"Received shape: {signal.shape}"
        )

    if signal.shape[1] < 2:

        raise ValueError(
            "Test requires at least two ECG channels."
        )

    lead1 = signal[
        :,
        0,
    ]

    lead2 = signal[
        :,
        1,
    ]

    lead3 = signal[
        :,
        1,
    ]

    # =====================================================
    # Extract test duration
    # =====================================================

    samples_to_use = (
        fs
        * TEST_DURATION_SECONDS
    )

    if len(lead1) < samples_to_use:

        raise ValueError(
            f"Record does not contain "
            f"{TEST_DURATION_SECONDS} seconds of ECG."
        )

    lead1 = lead1[
        :samples_to_use
    ]

    lead2 = lead2[
        :samples_to_use
    ]

    lead3 = lead3[
        :samples_to_use
    ]

    print(
        f"Test duration: "
        f"{TEST_DURATION_SECONDS} seconds"
    )

    print(
        f"Samples per lead: "
        f"{len(lead1)}"
    )

    # =====================================================
    # Run complete Layer 1
    # =====================================================

    result = extract_three_lead_features(
        lead1=lead1,
        lead2=lead2,
        lead3=lead3,
        fs=fs,
        primary_lead_index=PRIMARY_LEAD_INDEX,
    )

    # =====================================================
    # General ECG features
    # =====================================================

    print()
    print("=" * 70)
    print("GENERAL ECG FEATURES")
    print("=" * 70)

    print(
        f"Primary lead: "
        f"{result['primaryLead']}"
    )

    print(
        f"Duration: "
        f"{result['durationSeconds']:.2f} seconds"
    )

    heart_rate = result[
        "heartRate"
    ]

    if heart_rate is None:

        print(
            "Heart rate: unavailable"
        )

    else:

        print(
            f"Heart rate: "
            f"{heart_rate:.2f} BPM"
        )

    print(
        f"Detected R-peaks: "
        f"{result['rPeakCount']}"
    )

    # =====================================================
    # RR intervals
    # =====================================================

    print()
    print("=" * 70)
    print("RR INTERVALS")
    print("=" * 70)

    rr_intervals = result[
        "rrIntervalsMs"
    ]

    print(
        f"Number of RR intervals: "
        f"{len(rr_intervals)}"
    )

    if len(rr_intervals) > 0:

        print(
            "First 10 RR intervals (ms):"
        )

        print(
            rr_intervals[
                :10
            ]
        )

    else:

        print(
            "No RR intervals available."
        )

    # =====================================================
    # HRV
    # =====================================================

    print()
    print("=" * 70)
    print("HRV")
    print("=" * 70)

    hrv = result[
        "hrv"
    ]

    for key, value in hrv.items():

        if value is None:

            print(
                f"{key}: unavailable"
            )

        else:

            print(
                f"{key}: "
                f"{value:.2f}"
            )

    print(
        f"HRV data sufficient: "
        f"{result['hrvDataSufficient']}"
    )

    # =====================================================
    # ECG morphology
    # =====================================================

    print()
    print("=" * 70)
    print("ECG MORPHOLOGY")
    print("=" * 70)

    morphology = result[
        "morphology"
    ]

    for key, value in morphology.items():

        if value is None:

            print(
                f"{key}: unavailable"
            )

        elif isinstance(
            value,
            float,
        ):

            print(
                f"{key}: "
                f"{value:.2f}"
            )

        else:

            print(
                f"{key}: "
                f"{value}"
            )

    # =====================================================
    # Signal quality
    # =====================================================

    print()
    print("=" * 70)
    print("SIGNAL QUALITY")
    print("=" * 70)

    lead_quality = result[
        "leadQuality"
    ]

    for lead_name, quality in (
        lead_quality.items()
    ):

        print(
            f"{lead_name}:"
        )

        print(
            f"  Valid: "
            f"{quality['valid']}"
        )

        print(
            f"  Flags: "
            f"{quality['flags']}"
        )

    # =====================================================
    # R-peak sample indices
    # =====================================================

    print()
    print("=" * 70)
    print("R-PEAK INDICES")
    print("=" * 70)

    r_peaks = result[
        "rPeaks"
    ]

    print(
        f"Total R-peaks: "
        f"{len(r_peaks)}"
    )

    print(
        "First 20 R-peaks:"
    )

    print(
        r_peaks[
            :20
        ]
    )

    # =====================================================
    # Compact Layer-1 JSON summary
    #
    # processedLeads is intentionally excluded because
    # each lead contains thousands of signal samples.
    # =====================================================

    summary = {
        key: value
        for key, value in result.items()
        if key != "processedLeads"
    }

    print()
    print("=" * 70)
    print("LAYER-1 JSON SUMMARY")
    print("=" * 70)

    print(
        json.dumps(
            summary,
            indent=2,
        )
    )

    # =====================================================
    # Basic software sanity checks
    # =====================================================

    print()
    print("=" * 70)
    print("SANITY CHECKS")
    print("=" * 70)

    checks_passed = True

    # -----------------------------------------------------
    # Heart-rate availability
    # -----------------------------------------------------

    if result[
        "heartRate"
    ] is None:

        print(
            "⚠️ Heart rate was not calculated."
        )

        checks_passed = False

    else:

        print(
            "✅ Heart rate calculated"
        )

    # -----------------------------------------------------
    # R peaks
    # -----------------------------------------------------

    if result[
        "rPeakCount"
    ] < 2:

        print(
            "⚠️ Too few R-peaks detected."
        )

        checks_passed = False

    else:

        print(
            "✅ R-peaks detected"
        )

    # -----------------------------------------------------
    # RR intervals
    # -----------------------------------------------------

    if len(
        result[
            "rrIntervalsMs"
        ]
    ) == 0:

        print(
            "⚠️ No RR intervals calculated."
        )

        checks_passed = False

    else:

        print(
            "✅ RR intervals calculated"
        )

    # -----------------------------------------------------
    # Morphology delineation
    # -----------------------------------------------------

    if result[
        "morphology"
    ].get(
        "delineationAvailable",
        False,
    ):

        print(
            "✅ ECG morphology delineation available"
        )

    else:

        print(
            "⚠️ ECG morphology delineation unavailable"
        )

    # -----------------------------------------------------
    # Signal quality
    # -----------------------------------------------------

    all_leads_valid = all(
        quality[
            "valid"
        ]
        for quality
        in result[
            "leadQuality"
        ].values()
    )

    if all_leads_valid:

        print(
            "✅ All test leads passed basic quality checks"
        )

    else:

        print(
            "⚠️ One or more leads have quality flags"
        )

    # =====================================================
    # Final message
    # =====================================================

    print()
    print("=" * 70)

    if checks_passed:

        print(
            "✅ Layer-1 test completed successfully"
        )

    else:

        print(
            "⚠️ Layer-1 test completed with warnings"
        )

    print("=" * 70)


if __name__ == "__main__":
    main()