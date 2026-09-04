from fastapi import FastAPI

from api.schemas import ECGRequest

from services.inference import ECGInference



app = FastAPI(

    title="CardiShirt AI API",

    description="AI ECG Risk Screening System"

)



# Load models once

engine = ECGInference()



@app.get("/")
def home():

    return {

        "status":
        "CardiShirt AI running"

    }



# ======================================
# AI PREDICTION
# POST /predict
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