import torch
import numpy as np

from model import ECGCNNLSTM


MODEL_PATH = "../data/ad8232_binary_arrhythmia_model.pt"


DEVICE = torch.device("cpu")


CLASS_NAMES = [
    "normal",
    "abnormal"
]



class ArrhythmiaDetector:


    def __init__(self):

        self.model = ECGCNNLSTM(
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



    def preprocess(self, ecg):


        ecg = (

            ecg -
            np.mean(ecg)

        ) / (

            np.std(ecg)
            +
            1e-8

        )


        # model trained with 720 samples

        if len(ecg) > 720:

            ecg = ecg[:720]


        elif len(ecg) < 720:

            ecg = np.pad(
                ecg,
                (0,720-len(ecg))
            )


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



    def predict(self, ecg):


        x = self.preprocess(
            ecg
        ).to(DEVICE)



        with torch.no_grad():


            output = self.model(x)


            probability = torch.softmax(
                output,
                dim=1
            )


            prediction = torch.argmax(
                probability,
                dim=1
            ).item()



        return {

            "prediction":
            CLASS_NAMES[prediction],


            "confidence":
            float(
                probability[0][prediction]
            )

        }