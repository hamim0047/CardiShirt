from fastapi import FastAPI
import torch
import numpy as np

from config import SCRIPTED_MODEL_PATH

app = FastAPI()

model = torch.jit.load(SCRIPTED_MODEL_PATH, map_location="cpu")
model.eval()

CLASS_NAMES = ["normal", "ventricular", "atrial", "other_abnormal"]


def pad_or_trim(arr, target_len=720):
    arr = np.array(arr, dtype=np.float32)

    if len(arr) > target_len:
        return arr[:target_len]

    if len(arr) < target_len:
        pad_width = target_len - len(arr)
        return np.pad(arr, (0, pad_width), mode="edge")

    return arr


@app.post("/predict")
async def predict(data: dict):
    lead1 = pad_or_trim(data["lead1"])
    lead2 = pad_or_trim(data["lead2"])
    lead3 = pad_or_trim(data["lead3"])

    x = np.stack([lead1, lead2, lead3], axis=0)  # (3, 720)
    x = torch.tensor(x, dtype=torch.float32).unsqueeze(0)  # (1, 3, 720)

    with torch.no_grad():
        out = model(x)
        probs = torch.softmax(out, dim=1)[0].tolist()

    pred_idx = int(np.argmax(probs))

    return {
        "classIndex": pred_idx,
        "className": CLASS_NAMES[pred_idx],
        "confidence": float(max(probs)),
        "probabilities": probs,
    }