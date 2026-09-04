
import time
from layer2.arrhythmia_inference import ArrhythmiaDetector
from layer2.mi_inference import MIDetector
from layer2.rule_engine import risk_engine

from layer3.gemini_explainer import GeminiECGExplainer

class CardiShirtDecision:



    def __init__(self):


        # ===============================
        # LAYER 2 AI MODELS
        # ===============================


        self.arrhythmia = ArrhythmiaDetector()


        self.mi = MIDetector()




        # ===============================
        # LAYER 3 EXPLANATION SYSTEM
        # ===============================


        # Primary:
        # Gemini API

        self.gemini = GeminiECGExplainer()



    def analyze(

        self,

        raw_ecg,

        layer1_output

    ):



        # =================================
        # ARRHYTHMIA MODEL
        # =================================


        arr_result = self.arrhythmia.predict(

            raw_ecg

        )





        # =================================
        # MI MODEL
        # =================================


        mi_result = self.mi.predict(

            raw_ecg

        )





        # =================================
        # RISK ENGINE
        # =================================


        final = risk_engine(

            arr_result,

            mi_result,

            layer1_output

        )





        # =================================
        # LAYER 2 OUTPUT
        # =================================


        layer2_result = {


            "arrhythmia":

            arr_result,



            "MI":

            mi_result,



            "decision":

            final,



            "ecg_metrics": {



                "heartRate":

                layer1_output.get(

                    "heartRate"

                ),



                "hrv":

                layer1_output.get(

                    "hrv"

                ),



                "morphology":

                layer1_output.get(

                    "morphology"

                )


            }

        }





        # =================================
        # LAYER 3 EXPLANATION
        #
        # Total limit = 10 seconds
        #
        # Gemini
        #    |
        #    ↓
        # Qwen Local
        #    |
        #    ↓
        # Static fallback
        #
        # =================================



        explanation = None


        start_time = time.time()





        # -------------------------------
        # 1. Gemini
        # -------------------------------


        try:


            remaining_time = 10 - (

                time.time() - start_time

            )


            if remaining_time > 0:


                explanation = self.run_with_timeout(

                    self.gemini.explain,

                    layer2_result,

                    remaining_time

                )


                print(

                    "Gemini explanation generated"

                )



        except Exception as e:


            print(

                "Gemini failed:"

            )


            print(e)


        # -------------------------------
        # 3. Static fallback
        # -------------------------------


        if not explanation:



            print(

                "Using risk based fallback explanation..."

            )



            explanation = self.generate_fallback_explanation(

                layer2_result

            )








        # =================================
        # FINAL RESPONSE
        # =================================


        return {



            "arrhythmia":

            arr_result,



            "MI":

            mi_result,



            "decision":

            final,



            "explanation":

            explanation

        }








    # =====================================
    # RISK BASED FALLBACK EXPLANATION
    # =====================================


    def generate_fallback_explanation(

        self,

        layer2_result

    ):



        decision = layer2_result.get(

            "decision",

            {}

        )



        risk = decision.get(

            "risk",

            "UNKNOWN"

        )



        risk = str(risk).upper()






        if risk == "LOW":


            return """

CardiShirt AI ECG Screening Summary


Risk Level: LOW


ECG Analysis:

The AI system did not detect significant abnormalities in the current ECG recording.


Findings:

• Heart rhythm appears within normal range.
• No major abnormal cardiac pattern detected.
• ECG features indicate a low-risk pattern.


Recommendation:

Continue regular monitoring and maintain a healthy lifestyle.
Consult a healthcare professional if new symptoms appear.


Powered by CardiShirt AI.

"""





        elif risk == "MEDIUM":


            return """

CardiShirt AI ECG Screening Summary


Risk Level: MEDIUM


ECG Analysis:

The AI detected some ECG variations that require observation.


Findings:

• Some abnormal ECG features were identified.
• The current pattern does not indicate immediate emergency.
• Continuous monitoring is recommended.


Recommendation:

Discuss these findings with a healthcare professional for further evaluation.


Powered by CardiShirt AI.

"""






        elif risk == "HIGH":


            return """

CardiShirt AI ECG Screening Summary


Risk Level: HIGH


ECG Analysis:

The AI detected abnormal ECG patterns associated with increased cardiovascular risk.


Findings:

• Abnormal rhythm or cardiac features were detected.
• Combined AI models classified this ECG as high risk.
• Further medical assessment is recommended.


Recommendation:

Seek medical advice, especially if chest pain, shortness of breath,
dizziness, fainting, or palpitations are present.


Powered by CardiShirt AI.

"""







        elif risk == "CRITICAL":


            return """

CardiShirt AI Emergency ECG Summary


Risk Level: CRITICAL


ECG Analysis:

The AI detected critical ECG abnormalities requiring urgent attention.


Findings:

• Significant abnormal ECG patterns were detected.
• Risk engine classified this recording as critical.
• Immediate evaluation may be required.


Recommendation:

Seek emergency medical assistance immediately if symptoms are present.


Powered by CardiShirt AI Emergency System.

"""






        else:


            return """

CardiShirt AI ECG Summary


Risk Level: UNKNOWN


ECG analysis completed, but explanation services were unavailable.


Please review ECG results with a healthcare professional.


Powered by CardiShirt AI.

"""