import sys
import os

sys.path.append(
    os.path.dirname(
        os.path.dirname(
            os.path.abspath(__file__)
        )
    )
)

from layer3.local_llm_explainer import LocalLLMExplainer


llm = LocalLLMExplainer()


data = {

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


result = llm.explain(data)


print(result)