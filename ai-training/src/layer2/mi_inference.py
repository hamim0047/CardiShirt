import torch
import numpy as np

from scipy.signal import resample

from mi_model import MICNNLSTM



MODEL_PATH = "../data/mi_model.pt"


DEVICE = torch.device("cpu")



CLASS_NAMES = [

    "normal",

    "MI"

]



class MIDetector:



    def __init__(self):


        self.model = MICNNLSTM(

            in_channels=1,

            num_classes=2

        ).to(DEVICE)



        self.model.load_state_dict(

            torch.load(

                MODEL_PATH,

                map_location=DEVICE

            )

        )


        self.model.eval()




    # ==========================================
    # Preprocess one 5 second window
    # Training input:
    # 100 Hz x 5 sec = 500 samples
    # ==========================================

    def preprocess(self, ecg):


        ecg = np.asarray(

            ecg,

            dtype=np.float32

        )


        ecg = (

            ecg -

            np.mean(ecg)

        ) / (

            np.std(ecg)

            +

            1e-8

        )



        # Ensure 500 samples

        if len(ecg) > 500:


            ecg = ecg[:500]



        elif len(ecg) < 500:


            ecg = np.pad(

                ecg,

                (

                    0,

                    500-len(ecg)

                )

            )



        # Shape:
        # batch, channel, samples

        ecg = np.expand_dims(

            ecg,

            axis=0

        )


        ecg = np.expand_dims(

            ecg,

            axis=0

        )



        return torch.tensor(

            ecg,

            dtype=torch.float32

        )





    # ==========================================
    # MI Prediction
    # ==========================================

    def predict(self, ecg):


        ecg = np.asarray(

            ecg,

            dtype=np.float32

        )



        # ======================================
        # Sampling correction
        #
        # PTBDB:
        # testing = 1000 Hz
        #
        # Training:
        # 100 Hz
        #
        # Convert to training frequency
        # ======================================

        original_length = len(ecg)



        target_length = int(

            original_length * 100 / 1000

        )



        if original_length != target_length:


            ecg = resample(

                ecg,

                target_length

            )



        # ======================================
        # Sliding windows
        # ======================================

        window_size = 500

        step = 500



        windows = []



        for start in range(

            0,

            len(ecg)-window_size+1,

            step

        ):


            window = ecg[

                start:start+window_size

            ]


            windows.append(

                window

            )



        # Short signal protection

        if len(windows) == 0:


            windows.append(

                ecg

            )



        mi_probabilities = []



        # ======================================
        # Predict every window
        # ======================================

        with torch.no_grad():


            for window in windows:


                x = self.preprocess(

                    window

                ).to(DEVICE)



                output = self.model(

                    x

                )



                probability = torch.softmax(

                    output,

                    dim=1

                )



                # class 1 = MI

                mi_probability = probability[0][1].item()



                mi_probabilities.append(

                    mi_probability

                )



        # ======================================
        # Hybrid aggregation
        # ======================================

        sorted_probs = sorted(

            mi_probabilities,

            reverse=True

        )



        top_k = max(

            5,

            int(len(sorted_probs)*0.10)

        )



        top_mean = np.mean(

            sorted_probs[:top_k]

        )



        maximum = max(

            mi_probabilities

        )



        final_probability = (

            0.7 * maximum

            +

            0.3 * top_mean

        )



        # ======================================
        # Final decision
        # ======================================

        if final_probability >= 0.55:


            prediction = "MI"


        else:


            prediction = "normal"



        return {


            "prediction":

            prediction,


            "confidence":

            float(

                final_probability

            ),


            "mi_probability":

            float(

                final_probability

            ),


            "max_window_probability":

            float(

                maximum

            ),


            "windows_tested":

            len(windows)

        }