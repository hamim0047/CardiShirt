from layer2.arrhythmia_inference import ArrhythmiaDetector
from layer2.mi_inference import MIDetector
from layer2.rule_engine import risk_engine

from layer3.gemini_explainer import GeminiECGExplainer



class CardiShirtDecision:


    def __init__(self):

        self.arrhythmia = ArrhythmiaDetector()

        self.mi = MIDetector()

        self.gemini = GeminiECGExplainer()



    def analyze(

        self,

        raw_ecg,

        layer1_output

    ):


        arr_result = self.arrhythmia.predict(

            raw_ecg

        )


        mi_result = self.mi.predict(

            raw_ecg

        )


        final = risk_engine(

            arr_result,

            mi_result,

            layer1_output

        )


        layer2_result = {


    "arrhythmia": arr_result,


    "MI": mi_result,


    "decision": final,


    "ecg_metrics": {

        "heartRate":
        layer1_output.get("heartRate"),


        "hrv":
        layer1_output.get("hrv"),


        "morphology":
        layer1_output.get("morphology")

    }

    }



        explanation = self.gemini.explain(

            layer2_result

        )



        return {


            "arrhythmia": arr_result,


            "MI": mi_result,


            "decision": final,


            "explanation": explanation

        }