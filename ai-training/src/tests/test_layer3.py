import sys
import os


# Add src path
sys.path.append(

    os.path.dirname(

        os.path.dirname(

            os.path.abspath(__file__)

        )

    )

)



from layer3.gemini_explainer import GeminiECGExplainer




print("="*60)

print("TEST: CARDISHIRT LAYER-3 GEMINI EXPLANATION")

print("="*60)



# ==========================================
# Fake Layer-2 Output
# (Same format from decision_pipeline.py)
# ==========================================

layer2_result = {


    "arrhythmia":

    {

        "prediction":

        "abnormal",


        "confidence":

        0.95

    },


    "MI":

    {

        "prediction":

        "MI",


        "confidence":

        0.97

    },


    "decision":

    {

        "risk":

        "CRITICAL",


        "reason":

        [

            "Possible myocardial infarction",

            "Abnormal rhythm detected"

        ]

    }

}




# ==========================================
# Gemini Layer 3
# ==========================================


gemini = GeminiECGExplainer()



explanation = gemini.explain(

    layer2_result

)



print()

print("="*60)

print("GEMINI RESPONSE")

print("="*60)


print(explanation)



print()

print("="*60)

print("LAYER-3 TEST COMPLETED")

print("="*60)