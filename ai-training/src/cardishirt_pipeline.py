import numpy as np


from layer1.pipeline import (
    extract_ecg_features
)


from layer2.decision_pipeline import (
    CardiShirtDecision
)



class CardiShirtPipeline:


    def __init__(self):


        # Layer 2 contains:
        # Arrhythmia model
        # MI model
        # Rule engine

        self.decision_engine = CardiShirtDecision()



    def analyze(self, ecg_signal, fs):


        # ==================================
        # LAYER 1
        # ECG Processing
        # ==================================


        layer1_output = extract_ecg_features(

            ecg_signal,

            fs

        )



        # ==================================
        # LAYER 2
        # AI + Rule Engine
        # ==================================


        layer2_output = self.decision_engine.analyze(

            ecg_signal,

            layer1_output

        )



        # ==================================
        # FINAL OUTPUT
        # Layer 3 is already called inside
        # decision_pipeline.py
        # ==================================


        return {

    "layer1": layer1_output,


    "layer2": {

        "arrhythmia":
        layer2_output["arrhythmia"],


        "MI":
        layer2_output["MI"],


        "decision":
        layer2_output["decision"]

    },


    "layer3": {

        "explanation":
        layer2_output["explanation"]

    }


        }