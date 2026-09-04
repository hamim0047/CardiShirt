import sys
import os

sys.path.append(
    os.path.dirname(
        os.path.dirname(
            os.path.abspath(__file__)
        )
    )
)
from layer3.gemini_explainer import GeminiECGExplainer


gemini = GeminiECGExplainer()


result = {

    "decision":{
        "risk":"HIGH"
    },

    "MI":{
        "prediction":"positive",
        "confidence":0.91
    },

    "arrhythmia":{
        "prediction":"abnormal",
        "confidence":0.95
    }

}


print(
    gemini.explain(result)
)