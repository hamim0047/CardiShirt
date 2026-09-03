from pydantic import BaseModel
from typing import List



class ECGRequest(BaseModel):

    ecg: List[float]

    sampling_rate: int


