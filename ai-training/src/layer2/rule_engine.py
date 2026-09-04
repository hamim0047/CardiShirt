def risk_engine(

    arrhythmia_result,

    mi_result,

    ecg_metrics

):


    # =================================
    # Extract Layer-1 metrics
    # =================================

    heart_rate = ecg_metrics.get(
        "heartRate",
        0
    )


    hrv = ecg_metrics.get(
    "hrv",
    {}
    ) or {}


    morphology = ecg_metrics.get(
    "morphology",
    {}
    ) or {}


    quality = ecg_metrics.get(
    "signalQualityFlags",
    []
    ) or []


    sdnn = hrv.get(
        "sdnn",
        None
    )


    qrs = morphology.get(
        "meanQRSDurationMs",
        0
    )


    st = morphology.get(
        "meanSTDeviationSignalUnits",
        0
    )


    qtc = morphology.get(
        "meanQTcBazettMs",
        0
    )


    reasons = []



    # =================================
    # Signal quality
    # =================================

    if len(quality) > 0:

        return {

            "risk": "UNRELIABLE",

            "reason": [

                "Poor ECG signal quality",

                "Repeat measurement"

            ]

        }



    # =================================
    # CRITICAL
    # =================================

    if (

    mi_result["prediction"] == "MI"

    and

    mi_result["confidence"] > 0.90

    and

    abs(st or 0) > 0.10

    and

    arrhythmia_result["prediction"] != "normal"

    and

    arrhythmia_result["confidence"] > 0.90

    ):


        return {

            "risk": "CRITICAL",

            "reason": [

                "Possible myocardial infarction",

                "Abnormal rhythm detected"

            ]

        }




    # =================================
    # HIGH RISK
    # =================================

    if (

    mi_result["prediction"] == "MI"

    and

    mi_result["confidence"] > 0.90

    ):


        return {

            "risk": "HIGH",

            "reason": [

                "Possible MI pattern detected",

                "AI prediction supported by ECG morphology"

            ]

        }




    # =================================
    # MODERATE RISK
    # =================================

    if (

        arrhythmia_result["prediction"] != "normal"

    ):

        reasons.append(
            "Abnormal rhythm detected"
        )



    if heart_rate > 120:

        reasons.append(
            "High heart rate"
        )



    if heart_rate < 50:

        reasons.append(
            "Low heart rate"
        )



    if (

        sdnn is not None

        and

        sdnn < 20

    ):

        reasons.append(
            "Low HRV"
        )



    if qtc > 450:

        reasons.append(
            "Prolonged QTc"
        )



    if len(reasons) > 0:

        return {

            "risk": "MODERATE",

            "reason": reasons

        }




    # =================================
    # LOW RISK
    # =================================

    return {

        "risk": "LOW",

        "reason": [

            "Normal ECG metrics",

            "No significant abnormality detected"

        ]

    }