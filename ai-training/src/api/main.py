from fastapi import FastAPI

from api.schemas import ECGRequest

from services.inference import ECGInference

import wfdb



app = FastAPI(

    title="CardiShirt AI API",

    description="AI ECG Risk Screening System"

)



# Load AI once

engine = ECGInference()




@app.get("/")

def home():

    return {

        "status":

        "CardiShirt AI running"

    }





# ======================================
# GET ECG DATASET SAMPLE
# ======================================

@app.get("/sample-ecg")
def sample_ecg():


    RECORD_PATH = "../data/ptbdb/patient229/s0453_re"


    record = wfdb.rdrecord(
        RECORD_PATH
    )


    # Lead I

    signal = record.p_signal[:,0]


    # Reduce data only for dashboard visualization
    # Keep original ECG for AI prediction

    display_signal = signal[::20]



    return {


        "ecg":

        display_signal.tolist(),



        "sampling_rate":

        int(record.fs / 20)


    }






# ======================================
# AI PREDICTION
# ======================================

@app.post("/predict")

def predict_ecg(

    request: ECGRequest

):


    result = engine.predict(

        request.ecg,

        request.sampling_rate

    )


    return result