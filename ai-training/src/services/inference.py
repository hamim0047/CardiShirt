from cardishirt_pipeline import CardiShirtPipeline
import numpy as np



class ECGInference:



    def __init__(self):

        self.model = CardiShirtPipeline()



    def predict(

        self,

        ecg,

        sampling_rate

    ):


        ecg_signal = np.array(

            ecg,

            dtype=np.float32

        )


        result = self.model.analyze(

            ecg_signal,

            sampling_rate

        )


        return result